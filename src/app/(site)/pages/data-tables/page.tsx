import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DataTables from "@/components/DataTables";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DataTables",
  // other metadata
};

export default function Page() {
  return (
    <>
      <Breadcrumb pageName="Data Tables" />
      <DataTables />
    </>
  );
}
