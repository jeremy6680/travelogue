import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type MultiSelectOption = {
  value: string;
  label: string;
};

interface MultiSelectFilterProps {
  label: string;
  placeholder: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  className?: string;
  align?: "start" | "center" | "end";
  "data-testid"?: string;
}

export function MultiSelectFilter({
  label,
  placeholder,
  options,
  selectedValues,
  onChange,
  className,
  align = "start",
  "data-testid": dataTestId,
}: MultiSelectFilterProps) {
  const selectedLabels = options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);

  const triggerLabel =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${placeholder} (${selectedLabels.length})`;

  const toggleValue = (value: string, checked: boolean | "indeterminate") => {
    if (checked === true) {
      onChange([...selectedValues, value]);
      return;
    }

    onChange(selectedValues.filter((currentValue) => currentValue !== value));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-between gap-2 overflow-hidden text-left font-normal",
            className,
          )}
          data-testid={dataTestId}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-72 p-0">
        <div className="border-b px-4 py-3">
          <div className="text-sm font-semibold text-foreground">{label}</div>
          {selectedValues.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {placeholder}
            </button>
          )}
        </div>

        <ScrollArea className="max-h-72">
          <div className="space-y-1 p-2">
            {options.map((option) => {
              const checked = selectedValues.includes(option.value);

              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(nextChecked) =>
                      toggleValue(option.value, nextChecked)
                    }
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-snug text-foreground">
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
