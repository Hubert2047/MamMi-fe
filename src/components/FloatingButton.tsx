import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

type Props = {
  open: boolean;
  setOpenBtns: React.Dispatch<React.SetStateAction<boolean>>;
};

export function FloatingButton({ open, setOpenBtns }: Props) {
  return (
    <Button
      className="h-9 w-9 shrink-0 rounded-full bg-gray-900 shadow-lg"
      size="icon"
      onClick={() => setOpenBtns(!open)}
    >
      {open ? <ChevronLeft /> : <ChevronRight />}
    </Button>
  );
}
