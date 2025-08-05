"use server"; //you mark all the exported functions within the file as Server Actions. These server functions can then be imported and used in Client and Server components

// You can also write Server Actions directly inside Server Components by adding "use server" inside the action. But for this course, we'll keep them all organized in a separate file. We recommend having a separate file for your actions.

// ejemplo:
//* Server Component
// export default function Page() {
//* Action
//   async function create(formData: FormData) {
//     'use server';

//* Logic to mutate data...
//   }

//* Invoke the action using the "action" attribute
//   return <form action={create}>...</form>;
// }

//! Behind the scenes, Server Actions create a POST API endpoint. This is why you don't need to create API endpoints manually when using Server Actions.

//import { z } from "zod"; // In your actions.ts file, import Zod and define a schema that matches the shape of your form object. This schema will validate the formData before saving it to a database.
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as v from "valibot";

 
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

//* enum_ ==> Esa línea en Valibot define un esquema de enumeración (enum) llamado StatusEnum, que solo acepta dos valores válidos: 'pending' o 'paid'.
const StatusEnum = v.pipe(
  v.string("Please select a valid status: pending or paid."),
  v.enum_({
    pending: "pending",
    paid: "paid",
  })
);

// 🧠 ¿Por qué usar enum_()?
// Porque ayuda a:
// Validar datos de formularios con valores predefinidos.
// Evitar errores por strings mal escritos o valores no permitidos.
// Asegurar que tus datos cumplen con una lista cerrada de opciones.

const FormSchema = v.object({
  id: v.string(),
  customerId: v.pipe(
    //El método pipe() de Valibot sirve para encadenar validaciones y transformaciones. Es decir, toma un valor, lo pasa por una serie de funciones (como validadores o transformadores), y cada paso opera sobre el resultado del anterior.
    v.string("Please enter a customer from the list."),
    v.nonEmpty("Customer is required.")
  ),
  amount: v.pipe(
    v.string("Please enter an amount greater than $0."),
    v.transform((val) => Number(val)),
    v.number("Please enter an amount greater than $0."),
    v.minValue(0.01, "Please enter an amount greater than $0.")
  ),
  status: StatusEnum,
  date: v.string(),
});

//const CreateInvoice = FormSchema.omit({ id: true, date: true });
const CreateInvoice = v.omit(FormSchema, ["id", "date"]); //Crea un nuevo esquema de validación basado en FormSchema, pero omitiendo (eliminando) los campos "id" y "date".
// 📌 ¿Para qué se usa?
// Sirve para reutilizar el esquema FormSchema en otro contexto donde no necesitás validar esos campos.

// Por ejemplo:

// FormSchema puede usarse para un formulario completo de edición de factura (donde "id" y "date" existen).

// CreateInvoice puede usarse para crear una factura nueva (donde "id" y "date" son generados automáticamente en el servidor y no deben venir del usuario).
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  console.log("soy prev state", prevState);
  // ...
  ///Back in your actions.ts file, you'll need to extract the values of formData
  // const rawFormData = {
  //const { customerId, amount, status } = CreateInvoice.parse({
  const validatedFields = v.safeParse(CreateInvoice, {
    // const validatedFields = CreateInvoice.safeParse({ // safeParse() will return an object containing either a success or error field. This will help handle validation more gracefully without having put this logic inside the try/catch block.
    customerId: formData.get("customerId"), // este es el name del input
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  // console.log(validatedFields)

  //If form validation fails, return errors early. Otherwise, continue.
  // if (!validatedFields.success) {
  //   return {
  //     errors: validatedFields.error.flatten().fieldErrors,
  //     message: 'Missing Fields. Failed to Create Invoice.',
  //   };
  // }

  if (!validatedFields.success) {
    // console.log(validatedFields.issues[0].path?.[0].key)
    return {
      errors: validatedFields.issues.reduce((acc, issue) => {
        const key = issue.path?.[0].key;
        if (typeof key === "string") {
          acc[key] = [...(acc[key] || []), issue.message];
        }
        console.log(acc);
        return acc;
      }, {} as Record<string, string[]>),
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }

  // Prepare data for insertion into the database
  // const { customerId, amount, status } = validatedFields.data;
  const { customerId, amount, status } = validatedFields.output;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0]; // format "YYYY-MM-DD"

  // Inserting the data into your database
  // you can create an SQL query to insert the new invoice into your database and pass in the variables:

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    console.log(error)
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }

  //!CACHE
  // Revalidate and redirect
  //Next.js has a client-side router cache that stores the route segments in the user's browser for a time.

  //* prefetching - revalidate

  //you're updating the data displayed in the invoices route, you want to clear this cache and trigger a new request to the server. You can do this with the revalidatePath function from Next.js:

  // Test it out:
  //  console.log(rawFormData); funcionaba antes de poner z

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices"); // redirijimos a la pagina
}

const UpdateInvoice = v.omit(FormSchema, ["id", "date"]);

export async function updateInvoice(
  id: string,
  preState: State,
  formData: FormData
) {
  //console.log('recibi esto al editar:', id, formData)
  const validatedFields = v.safeParse(UpdateInvoice, {
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    // console.log(validatedFields.issues[0].path?.[0].key)
    return {
      errors: validatedFields.issues.reduce((acc, issue) => {
        const key = issue.path?.[0].key;
        if (typeof key === "string") {
          acc[key] = [...(acc[key] || []), issue.message];
        }
        console.log(acc);
        return acc;
      }, {} as Record<string, string[]>),
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }

  const { customerId, amount, status } = validatedFields.output;

  const amountInCents = amount * 100;

  try {
    // throw new Error('Failed to Delete Invoice')
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
  } catch (error) {
    // We'll log the error to the console for now
    console.error(error);
    return {
      message: "Database Error: Failed to Update Invoice.",
    };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

//   Similarly to the createInvoice action, here you are:

// Extracting the data from formData.
// Validating the types with Zod.
// Converting the amount to cents.
// Passing the variables to your SQL query.
// Calling revalidatePath to clear the client cache and make a new server request.
// Calling redirect to redirect the user to the invoice's page.
// Test it out by editing an invoice. After submitting the form, you should be redirected to the invoices page, and the invoice should be updated.

export async function deleteInvoice(id: string) {
  //  throw new Error('Failed to Delete Invoice'); //!un error a proposito que tiro para testear
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath("/dashboard/invoices"); //revalidatePath will trigger a new server request and re-render the table.
}


 
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}
