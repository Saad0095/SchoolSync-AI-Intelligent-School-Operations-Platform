import { useState } from "react";

export const Command = ({ children }) => {
  return <div className="p-2">{children}</div>;
};

export const CommandInput = ({ placeholder, value, onChange }) => {
  return (
    <input
      type="text"
      className="w-full p-2 border rounded mb-1"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
};

export const CommandEmpty = ({ children }) => {
  return <div className="text-muted-foreground p-2">{children}</div>;
};

export const CommandGroup = ({ children }) => {
  return <div className="flex flex-col gap-1">{children}</div>;
};

export const CommandItem = ({ children, onSelect }) => {
  return (
    <div
      className="p-2 cursor-pointer hover:bg-muted rounded"
      onClick={onSelect}
    >
      {children}
    </div>
  );
};
