import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@kijk/ui/utils/style";
import { Button } from "@kijk/ui/components/button";
import { Popover, PopoverTrigger, PopoverContent } from "@kijk/ui/components/popover";
import { Calendar } from "@kijk/ui/components/calendar";

interface Props {
  date?: Date;
  setDate: (date?: Date) => void;
}

export function DatePicker(props: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "w-70 justify-start text-left font-normal",
            !props.date && "text-muted-foreground",
          )}
          variant="outline"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {props.date ? format(props.date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar initialFocus mode="single" selected={props.date} onSelect={props.setDate} />
      </PopoverContent>
    </Popover>
  );
}
