import React, { useState } from "react";
import MuiPagination from "@mui/material/Pagination";
import PaginationItem from "@mui/material/PaginationItem";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import Stack from "@mui/material/Stack";

type PaginationProps = {
    onPageChange: (event: React.ChangeEvent<unknown>, page: number) => void;
    page: number;
    totalPages: number;
    pageSize?: number; 
    className?: string; 
  };

export default function Pagination({
  onPageChange,
  page,
  totalPages,
  pageSize,
  className,
}:PaginationProps) {
  const [currentPage, setCurrentPage] = useState(1);
  return (
    <Stack dir="rtl" spacing={2} className="mt-10 mb-2 flex justify-center">
      <MuiPagination
        className="flex justify-center"
        dir="rtl"
        page={page}
        count={totalPages}
        color="primary"
        variant="outlined"
        shape="rounded"
        renderItem={(item) => (
          <PaginationItem
            slots={{ previous: NavigateNextIcon, next: NavigateBeforeIcon }}
            {...item}
          />
        )}
        onChange={onPageChange}
      />
    </Stack>
  );
}
