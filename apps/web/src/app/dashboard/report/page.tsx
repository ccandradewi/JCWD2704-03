import SalesPage from '@/components/dashboard/report/allSales/salesReport';
import Calendar from '@/components/dashboard/report/CalendarReport';
import PropertyReport from '@/components/dashboard/report/PropertyReport';
import Sales from '@/components/dashboard/report/Sales';
import UserReport from '@/components/dashboard/report/UserSales';
import React from 'react';

function page() {
  return (
    <>
      <div className="flex flex-col gap-10 max-w-screen-xl">
        <Sales />
        <PropertyReport />
        <UserReport />
        <Calendar />
      </div>
    </>
  );
}
export default page;
