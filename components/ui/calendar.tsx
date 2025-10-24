'use client'

import * as React from 'react'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { DayButton, DayPicker, getDefaultClassNames } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant']
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'bg-background/80 backdrop-blur-xl text-foreground group/calendar p-3 [--cell-size:2.5rem]',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString('default', { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn(
          'flex gap-4 flex-col md:flex-row relative',
          defaultClassNames.months,
        ),
        month: cn('flex flex-col w-full gap-4', defaultClassNames.month),
        nav: cn(
          'flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between',
          defaultClassNames.nav,
        ),
        button_previous: cn(
          'h-8 w-8 p-0 hover:bg-primary/10 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          'h-8 w-8 p-0 hover:bg-primary/10 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground',
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          'flex items-center justify-center h-8 w-full px-8',
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          'w-full flex items-center text-sm font-medium justify-center h-8 gap-1.5',
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          'relative has-focus:border-blue-500 border border-gray-300 dark:border-gray-600 shadow-sm has-focus:ring-blue-500/50 has-focus:ring-2 rounded-md',
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          'absolute bg-background dark:bg-gray-800 inset-0 opacity-0',
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          'select-none font-semibold text-foreground text-base',
          captionLayout === 'label'
            ? 'text-base'
            : 'rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5',
          defaultClassNames.caption_label,
        ),
        table: 'w-full border-collapse',
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'text-muted-foreground rounded-md flex-1 font-medium text-sm select-none',
          defaultClassNames.weekday,
        ),
        week: cn('flex w-full mt-2', defaultClassNames.week),
        week_number_header: cn(
          'select-none w-10',
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          'text-sm select-none text-muted-foreground',
          defaultClassNames.week_number,
        ),
        day: cn(
          'relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none',
          defaultClassNames.day,
        ),
        range_start: cn(
          'rounded-l-md bg-gradient-to-r from-pink-500 to-red-500 text-white',
          defaultClassNames.range_start,
        ),
        range_middle: cn('rounded-none bg-pink-500/20', defaultClassNames.range_middle),
        range_end: cn('rounded-r-md bg-gradient-to-r from-pink-500 to-red-500 text-white', defaultClassNames.range_end),
        today: cn(
          'bg-pink-500/30 text-white rounded-md data-[selected=true]:rounded-none font-semibold border border-pink-500/50',
          defaultClassNames.today,
        ),
        outside: cn(
          'text-muted-foreground/40 aria-selected:text-muted-foreground/40',
          defaultClassNames.outside,
        ),
        disabled: cn(
          'text-muted-foreground/30 opacity-50',
          defaultClassNames.disabled,
        ),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') {
            return (
              <ChevronLeftIcon className={cn('size-4', className)} {...props} />
            )
          }

          if (orientation === 'right') {
            return (
              <ChevronRightIcon
                className={cn('size-4', className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn('size-4', className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-10 items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'h-10 w-10 p-0 text-foreground hover:bg-primary/10 hover:text-primary data-[selected-single=true]:bg-gradient-to-r data-[selected-single=true]:from-pink-500 data-[selected-single=true]:to-red-500 data-[selected-single=true]:text-white data-[selected-single=true]:hover:from-pink-600 data-[selected-single=true]:hover:to-red-600 data-[range-middle=true]:bg-pink-500/20 data-[range-middle=true]:text-white data-[range-start=true]:bg-gradient-to-r data-[range-start=true]:from-pink-500 data-[range-start=true]:to-red-500 data-[range-start=true]:text-white data-[range-start=true]:hover:from-pink-600 data-[range-start=true]:hover:to-red-600 data-[range-end=true]:bg-gradient-to-r data-[range-end=true]:from-pink-500 data-[range-end=true]:to-red-500 data-[range-end=true]:text-white data-[range-end=true]:hover:from-pink-600 data-[range-end=true]:hover:to-red-600 group-data-[focused=true]/day:border-pink-500 group-data-[focused=true]/day:ring-pink-500/50 flex aspect-square size-auto w-full min-w-10 flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-2 data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70',
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }