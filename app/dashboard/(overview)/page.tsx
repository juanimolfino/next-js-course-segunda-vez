//import { Card } from "@/app/ui/dashboard/cards";
import RevenueChart from "@/app/ui/dashboard/revenue-chart";
import LatestInvoices from "@/app/ui/dashboard/latest-invoices";
import { lusitana } from "@/app/ui/fonts";
import {
  //  fetchRevenue, lo saco para hacerlo granular al suspense cuando demora su carga y traba toda la pagina por que solo lo esperan a el
  //fetchLatestInvoices,
  //fetchCardData,
} from "@/app/lib/data";
//* aca pongo el reemplazo de hacerlo granular, basucamente el suspense de react y el skeleton que le vamos a dar para q precarge hasta que el componente este LISTO, desp del fetch
import { Suspense } from "react";
import {
  RevenueChartSkeleton,
  LatestInvoicesSkeleton,
  CardsSkeleton
} from "@/app/ui/skeletons";
import CardWrapper from "@/app/ui/dashboard/cards"; //! Refresh the page, and you should see all the cards load in at the same time. You can use this pattern when you want multiple components to load in at the same time.

export default async function Page() {
  // The page is an async server component. This allows you to use await to fetch data.
  // const revenue = await fetchRevenue(); aca el tarda entonces hace que los que sigan tengan que esperarlo a el para poder hacer el fetch ellos
 // const latestInvoices = await fetchLatestInvoices();
  // const {
  //   numberOfCustomers,
  //   numberOfInvoices,
  //   totalPaidInvoices,
  //   totalPendingInvoices,
  // } = await fetchCardData();
  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* There are also 3 components which receive data: <Card>, <RevenueChart>, and <LatestInvoices> */}
        {/* <Card title="Collected" value={totalPaidInvoices} type="collected" />
        <Card title="Pending" value={totalPendingInvoices} type="pending" />
        <Card title="Total Invoices" value={numberOfInvoices} type="invoices" />
        <Card
          title="Total Customers"
          value={numberOfCustomers}
          type="customers"
        /> */}
        <Suspense fallback={<CardsSkeleton/>}>
          <CardWrapper/>
        </Suspense>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        {/* <RevenueChart revenue={revenue} /> ANTES */}
        {/* AHORA - con el granular */}
        <Suspense fallback={<RevenueChartSkeleton />}>
          {/* Finally, update the <RevenueChart> component to fetch its own data and remove the prop passed to it: */}
          <RevenueChart />
        </Suspense>
        <Suspense fallback={<LatestInvoicesSkeleton/>}>
          <LatestInvoices />
        </Suspense>
      </div>
    </main>
  );
}
