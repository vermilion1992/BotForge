"use client";
import * as React from "react";
const Null: React.FC<any> = ({ children }) => <>{children ?? null}</>;

export default Null;

// Common react-instantsearch-hooks-web components as no-ops
export const InstantSearch = Null;
export const SearchBox = Null;
export const Hits = Null;
export const Pagination = Null;
export const Configure = Null;
export const RefinementList = Null;
export const ClearRefinements = Null;


