// src/components/ui/chart.jsx
"use client"

import * as React from "react"
import { LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, Line, Area } from "recharts"

import { cn } from "@/lib/utils"

const ChartContext = React.createContext(undefined)

function ChartContainer({ id, className, children, config, ...props }) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId}`
  return (
    <ChartContext.Provider value={{ config, chartId }}>
      <div
        data-chart={chartId}
        className={cn("flex aspect-video justify-center text-foreground", className)}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  )
}

function ChartTooltip({ cursor = false, content, ...props }) {
  return (
    <Tooltip
      cursor={cursor}
      content={<ChartTooltipContent hideLabel={!cursor} hideIndicator={!cursor} {...props} />}
      {...props}
    />
  )
}

function ChartTooltipContent({
  className,
  viewBox,
  active,
  payload,
  label,
  hideLabel = false,
  hideIndicator = false,
  formatter,
  ...props
}) {
  const { config } = React.useContext(ChartContext)
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const relevantPayload = payload.filter((item) => config[item.dataKey])

  return (
    <div
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-md",
        className,
      )}
      {...props}
    >
      {!hideLabel && label && <div className="text-muted-foreground">{label}</div>}
      <div className="grid gap-1">
        {relevantPayload.map((item, i) => {
          const value = formatter ? formatter(item.value, item.name, item, i) : item.value
          return (
            <div key={item.dataKey} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {!hideIndicator && (
                  <span
                    className="flex h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: `hsl(${config[item.dataKey].color})`,
                    }}
                  />
                )}
                <span className="text-muted-foreground">{config[item.dataKey].label || item.name}</span>
              </div>
              <span className="font-mono font-medium text-foreground">{value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChartLegend({ className, ...props }) {
  const { config } = React.useContext(ChartContext)
  return (
    <div className={cn("flex items-center justify-center gap-4 text-xs text-muted-foreground", className)} {...props}>
      {Object.entries(config).map(([key, item]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{
              backgroundColor: `hsl(${item.color})`,
            }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

const ChartPrimitive = {
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartPrimitive }
