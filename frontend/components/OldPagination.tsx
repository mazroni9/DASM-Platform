import React from "react";
import classnames from "classnames";
import { usePagination, DOTS } from "./usePagination";

const Pagination = (props) => {
  const {
    onPageChange,
    totalCount,
    siblingCount = 1,
    currentPage,
    pageSize,
    className
  } = props;

  const paginationRange = usePagination({
    currentPage,
    totalCount,
    siblingCount,
    pageSize
  });

  if (currentPage === 0 || paginationRange.length < 2) {
    return null;
  }

  const onNext = (e) => {
    e?.preventDefault?.();
    if (currentPage === paginationRange[paginationRange.length - 1]) return;
    onPageChange(currentPage + 1);
  };

  const onPrevious = (e) => {
    e?.preventDefault?.();
    if (currentPage === 1) return;
    onPageChange(currentPage - 1);
  };

  const lastPage = paginationRange[paginationRange.length - 1];

  return (
    <ul className={classnames("pagination-container", className)}>
      {/* Previous */}
      <li
        className={classnames("page-item", { disabled: currentPage === 1 })}
      >
        <a
          href="#"
          className="page-link"
          onClick={onPrevious}
          aria-disabled={currentPage === 1}
          aria-label="السابق"
        >
          السابق
        </a>
      </li>

      {/* Numbers + DOTS */}
      {paginationRange.map((pageNumber, idx) => {
        if (pageNumber === DOTS) {
          return (
            <li key={`dots-${idx}`} className="page-item disabled">
              <span className="page-link">…</span>
            </li>
          );
        }

        const isActive = pageNumber === currentPage;

        return (
          <li
            key={`page-${pageNumber}`}
            className={classnames("page-item", { active: isActive })}
          >
            <a
              href="#"
              className="page-link"
              onClick={(e) => {
                e.preventDefault();
                if (!isActive) onPageChange(pageNumber);
              }}
              aria-current={isActive ? "page" : undefined}
            >
              {pageNumber}
            </a>
          </li>
        );
      })}

      {/* Next */}
      <li
        className={classnames("page-item", { disabled: currentPage === lastPage })}
      >
        <a
          href="#"
          className="page-link"
          onClick={onNext}
          aria-disabled={currentPage === lastPage}
          aria-label="التالي"
        >
          التالي
        </a>
      </li>
    </ul>
  );
};

export default Pagination;
