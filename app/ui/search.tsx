"use client";
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams(); // aca leo la url 
  const pathname = usePathname();
  const { replace } = useRouter();

 const handleSearch = useDebouncedCallback((term) => {
    console.log(`Searching... ${term}`);
    const params = new URLSearchParams(searchParams); //aca se la paso y el URLSearchParams lo interpreta, ahora params tiene un objeto de lo que dice la url pero manipulable con JS
//!ejemplo
//     const searchParams = "?q=hello&page=2";
// const params = new URLSearchParams(searchParams);

// console.log(params.get("q")); // "hello"
// console.log(params.get("page")); // "2"

params.set('page', '1'); // esto viene de la PAGINACION

    if (term) { // aca usamos el .set o .delete porque te lo habilita el URLSearchParams
      params.set('query', term);
    } else {
      params.delete('query');
    }
    //Now that you have the query string. You can use Next.js's useRouter and usePathname hooks to update the URL.
    replace(`${pathname}?${params.toString()}`);
//     ${pathname} is the current path, in your case, "/dashboard/invoices".
// As the user types into the search bar, params.toString() translates this input into a URL-friendly format.
// replace(${pathname}?${params.toString()}) updates the URL with the user's search data. For example, /dashboard/invoices?query=lee if the user searches for "Lee".
// The URL is updated without reloading the page, thanks to Next.js's client-side navigation (which you learned about in the chapter on navigating between pages.
  }, 500);
  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
        defaultValue={searchParams.get('query')?.toString()}
//         defaultValue vs. value / Controlled vs. Uncontrolled

// If you're using state to manage the value of an input, you'd use the value attribute to make it a controlled component. This means React would manage the input's state.

// However, since you're not using state, you can use defaultValue. This means the native input will manage its own state. This is okay since you're saving the search query to the URL instead of state.
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
