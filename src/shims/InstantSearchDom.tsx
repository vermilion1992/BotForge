"use client";
import React from "react";

export const InstantSearch: React.FC<any> = ({ children }) => <>{children}</>;
export const Configure: React.FC<any> = () => null;
export const Hits: React.FC<any> = () => null;

// HOC connectors: identity wrappers so existing components render fine
export const connectHits =
  (Comp: any) =>
  (props: any) =>
    <Comp {...props} />;

export const connectSearchBox =
  (Comp: any) =>
  (props: any) =>
    <Comp {...props} />;

// Optional UI some templates import
export const SearchBox: React.FC<any> = () => null;
export const RefinementList: React.FC<any> = () => null;

// Provide a default export too (covers any default import variants)
const _default = {
  InstantSearch,
  Configure,
  Hits,
  connectHits,
  connectSearchBox,
  SearchBox,
  RefinementList,
};
export default _default;


