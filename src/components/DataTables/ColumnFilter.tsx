import React, { useId } from "react";

interface ColumnFilterProps {
  column: {
    filterValue: string;
    setFilter: (value: string) => void;
  };
}

const ColumnFilter: React.FC<ColumnFilterProps> = ({ column }) => {
  const { filterValue, setFilter } = column;

  return (
    <input
      type="text"
      value={filterValue || ""}
      key={useId()}
      onChange={(e) => setFilter(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="mt-2.5 w-full rounded-md border border-stroke px-3 py-1 outline-none focus:border-primary"
    />
  );
};

export default ColumnFilter;
