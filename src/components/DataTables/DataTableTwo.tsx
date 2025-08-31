import { ChevronLeft, ChevronRight, SearchIcon } from "@/assets/icons";
import { useMemo } from "react";
import {
  Column,
  useFilters,
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from "react-table";
import { PointerUp } from "./icons";

const dataTwo = [
  {
    name: "Brielle Kuphal",
    position: "Senior Javascript Developer",
    office: "Edinburgh",
    age: "25",
    startDate: "2012/03/29",
    salary: "$433,060",
  },
  {
    name: "Barney Murray",
    position: "Senior Backend Developer",
    office: "amsterdam",
    age: "29",
    startDate: "2010/05/01",
    salary: "$424,785",
  },
  {
    name: "Ressie Ruecker",
    position: "Senior Frontend Developer",
    office: "Jakarta",
    age: "27",
    startDate: "2013/07/01",
    salary: "$785,210",
  },
  {
    name: "Teresa Mertz",
    position: "Senior Designer",
    office: "New Caledonia",
    age: "25",
    startDate: "2014/05/30",
    salary: "$532,126",
  },
  {
    name: "Chelsey Hackett",
    position: "Product Manager",
    office: "NewYork",
    age: "26",
    startDate: "2011/09/30",
    salary: "$421,541",
  },
  {
    name: "Tatyana Metz",
    position: "Senior Product Manager",
    office: "NewYork",
    age: "28",
    startDate: "2009/09/30",
    salary: "$852,541",
  },
  {
    name: "Oleta Harvey",
    position: "Junior Product Manager",
    office: "California",
    age: "25",
    startDate: "2015/10/30",
    salary: "$654,444",
  },
  {
    name: "Bette Haag",
    position: "Junior Product Manager",
    office: "Carolina",
    age: "29",
    startDate: "2017/12/31",
    salary: "$541,111",
  },
  {
    name: "Meda Ebert",
    position: "Junior Web Developer",
    office: "Amsterdam",
    age: "27",
    startDate: "2015/10/31",
    salary: "$651,456",
  },
  {
    name: "Elissa Stroman",
    position: "Junior React Developer",
    office: "Kuala Lumpur",
    age: "29",
    startDate: "2008/05/31",
    salary: "$566,123",
  },
  {
    name: "Sid Swaniawski",
    position: "Senior React Developer",
    office: "Las Vegas",
    age: "29",
    startDate: "2009/09/01",
    salary: "$852,456",
  },
  {
    name: "Madonna Hahn",
    position: "Senior Vue Developer",
    office: "New York",
    age: "27",
    startDate: "2006/10/01",
    salary: "$456,147",
  },
  {
    name: "Waylon Kihn",
    position: "Senior HTML Developer",
    office: "Amsterdam",
    age: "23",
    startDate: "2017/11/01",
    salary: "$321,254",
  },
  {
    name: "Jaunita Lindgren",
    position: "Senior Backend Developer",
    office: "Jakarta",
    age: "25",
    startDate: "2018/12/01",
    salary: "$321,254",
  },
  {
    name: "Lenora MacGyver",
    position: "Junior HTML Developer",
    office: "Carolina",
    age: "27",
    startDate: "2015/09/31",
    salary: "$852,254",
  },
  {
    name: "Edyth McCullough",
    position: "Senior Javascript Developer",
    office: "Edinburgh",
    age: "25",
    startDate: "2012/03/29",
    salary: "$433,060",
  },
  {
    name: "Ibrahim Stroman",
    position: "Senior Backend Developer",
    office: "amsterdam",
    age: "29",
    startDate: "2010/05/01",
    salary: "$424,785",
  },
  {
    name: "Katelynn Reichert",
    position: "Senior Frontend Developer",
    office: "Jakarta",
    age: "27",
    startDate: "2013/07/01",
    salary: "$785,210",
  },
  {
    name: "Logan Kiehn",
    position: "Senior Designer",
    office: "New Caledonia",
    age: "25",
    startDate: "2014/05/30",
    salary: "$532,126",
  },
  {
    name: "Rogers Stanton",
    position: "Product Manager",
    office: "NewYork",
    age: "26",
    startDate: "2011/09/30",
    salary: "$421,541",
  },
  {
    name: "Alanis Torp",
    position: "Senior Product Manager",
    office: "NewYork",
    age: "28",
    startDate: "2009/09/30",
    salary: "$852,541",
  },
  {
    name: "Jarvis Bauch",
    position: "Junior Product Manager",
    office: "California",
    age: "25",
    startDate: "2015/10/30",
    salary: "$654,444",
  },
  {
    name: "Trey Ritchie",
    position: "Junior Product Manager",
    office: "Carolina",
    age: "29",
    startDate: "2017/12/31",
    salary: "$541,111",
  },
  {
    name: "Ronny Dietrich",
    position: "Junior Web Developer",
    office: "Amsterdam",
    age: "27",
    startDate: "2015/10/31",
    salary: "$651,456",
  },
  {
    name: "Isabella Christiansen",
    position: "Junior React Developer",
    office: "Kuala Lumpur",
    age: "29",
    startDate: "2008/05/31",
    salary: "$566,123",
  },
];

// table header
const columns: Column<(typeof dataTwo)[number]>[] = [
  {
    Header: "Name",
    accessor: "name",
  },
  {
    Header: "Position",
    accessor: "position",
  },
  {
    Header: "Office",
    accessor: "office",
  },
  {
    Header: "Age",
    accessor: "age",
  },
  {
    Header: "Star Date",
    accessor: "startDate",
  },
  {
    Header: "Salary",
    accessor: "salary",
  },
];

const DataTableTwo = () => {
  const data = useMemo(() => dataTwo, []);

  const tableInstance = useTable(
    {
      columns,
      data,
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    state,
    setGlobalFilter,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    pageOptions,
    setPageSize,
    gotoPage,
  } = tableInstance;

  const { globalFilter, pageIndex, pageSize } = state;

  return (
    <section className="data-table-common data-table-two rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="flex justify-between px-7.5 py-4.5">
        <div className="relative z-20 w-full max-w-[414px]">
          <input
            type="text"
            value={globalFilter || ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full rounded-[7px] border border-stroke bg-[#F6F8FB] px-5 py-2.5 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:focus:border-primary"
            placeholder="Search here..."
          />

          <button className="absolute right-0 top-0 flex h-11.5 w-11.5 items-center justify-center rounded-r-md">
            <SearchIcon />
          </button>
        </div>

        <div className="flex items-center font-medium">
          <p className="pl-2 text-dark dark:text-current">Per Page:</p>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-transparent pl-2.5"
          >
            {[5, 10, 20, 50].map((page) => (
              <option key={page} value={page}>
                {page}
              </option>
            ))}
          </select>
        </div>
      </div>

      <table
        {...getTableProps()}
        className="datatable-table w-full table-auto !border-collapse overflow-hidden break-words px-4 md:table-fixed md:overflow-auto md:px-8"
      >
        <thead>
          {headerGroups.map((headerGroup, key) => (
            <tr {...headerGroup.getHeaderGroupProps()} key={key}>
              {headerGroup.headers.map((column, key) => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  key={key}
                >
                  <div className="flex items-center">
                    <span> {column.render("Header")}</span>

                    <div className="ml-2 inline-flex flex-col space-y-[2px]">
                      <PointerUp />

                      <PointerUp className="rotate-180" />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center">
                No data found
              </td>
            </tr>
          )}

          {page.map((row, key) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} key={key}>
                {row.cells.map((cell, key) => {
                  return (
                    <td {...cell.getCellProps()} key={key}>
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-between px-6 py-5">
        <p className="font-medium">
          Showing {pageIndex + 1} 0f {pageOptions.length} pages
        </p>
        <div className="flex">
          <button
            className="flex cursor-pointer items-center justify-center rounded-[3px] p-[7px] px-[7px] hover:bg-primary hover:text-white"
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
          >
            <ChevronLeft width={18} height={18} />
          </button>

          {pageOptions.map((_page, index) => (
            <button
              key={index}
              onClick={() => {
                gotoPage(index);
              }}
              className={`${
                pageIndex === index && "bg-primary text-white"
              } mx-1 flex cursor-pointer items-center justify-center rounded-[3px] p-1.5 px-[15px] hover:bg-primary hover:text-white`}
            >
              {index + 1}
            </button>
          ))}

          <button
            className="flex cursor-pointer items-center justify-center rounded-[3px] p-[7px] px-[7px] hover:bg-primary hover:text-white"
            onClick={() => nextPage()}
            disabled={!canNextPage}
          >
            <ChevronRight width={18} height={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default DataTableTwo;
