import { useState, cloneElement } from "react";

export const Popover = ({ children }) => {
  return <div className="relative">{children}</div>;
};

export const PopoverTrigger = ({ asChild, children }) => {
  const [open, setOpen] = useState(false);

  const trigger = asChild ? cloneElement(children, {
    onClick: () => setOpen(!open),
    "aria-expanded": open,
  }) : children;

  return (
    <>
      {trigger}
      {/* The PopoverContent will handle showing based on state */}
    </>
  );
};

export const PopoverContent = ({ children, className }) => {
  return (
    <div className={`absolute z-50 mt-1 w-full bg-card border rounded shadow ${className}`}>
      {children}
    </div>
  );
};
