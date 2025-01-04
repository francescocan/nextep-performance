'use client'

import Image from 'next/image'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

interface ChartDataPoint {
  date: Date;
  [key: string]: Date | number;
}

type SmoothingOption = 'none' | 'weekly' | 'monthly';

// Sample data with wider range of values
const sampleData: ChartDataPoint[] = Array.from({ length: 100 }, (_, i) => {
  const baseValue = 100
  const volatility = 40 // Increased volatility for better spread
  return {
    date: new Date(2023, 0, i + 1),
    'Muy Agresiva Cartera Propuesta': baseValue + Math.sin(i / 10) * volatility + Math.random() * 20,
    'Agresiva Cartera Propuesta': baseValue + Math.sin(i / 10) * (volatility * 0.8) + Math.random() * 15,
    'Equilibrada Cartera Propuesta': baseValue + Math.sin(i / 10) * (volatility * 0.6) + Math.random() * 10,
    'Moderada Cartera Propuesta': baseValue + Math.sin(i / 10) * (volatility * 0.4) + Math.random() * 8,
    'Conservadora Cartera Propuesta': baseValue + Math.sin(i / 10) * (volatility * 0.2) + Math.random() * 5,
    'EURO STOXX 50 PR EUR': baseValue + Math.cos(i / 15) * volatility + Math.random() * 25,
    'MSCI World PR UCL': baseValue + Math.cos(i / 12) * (volatility * 0.7) + Math.random() * 20,
    'Bloomberg Euro Agg Bond TR EUR': baseValue + Math.cos(i / 20) * (volatility * 0.3) + Math.random() * 15,
    'BME IBEX 35 PR EUR': baseValue + Math.sin(i / 8) * volatility + Math.random() * 30,
    'S&P 500 PR USD EUR': baseValue + Math.cos(i / 10) * (volatility * 0.9) + Math.random() * 22,
  }
})

const funds = [
  'Muy Agresiva Cartera Propuesta',
  'Agresiva Cartera Propuesta',
  'Equilibrada Cartera Propuesta',
  'Moderada Cartera Propuesta',
  'Conservadora Cartera Propuesta',
] as const

const indexes = [
  'EURO STOXX 50 PR EUR',
  'MSCI World PR UCL',
  'Bloomberg Euro Agg Bond TR EUR',
  'BME IBEX 35 PR EUR',
  'S&P 500 PR USD EUR',
] as const

const colors: Record<string, string> = {
  'Muy Agresiva Cartera Propuesta': '#00c853',
  'Agresiva Cartera Propuesta': '#ff9100',
  'Equilibrada Cartera Propuesta': '#2962ff',
  'Moderada Cartera Propuesta': '#d500f9',
  'Conservadora Cartera Propuesta': '#00bfa5',
  'EURO STOXX 50 PR EUR': '#ff1744',
  'MSCI World PR UCL': '#6200ea',
  'Bloomberg Euro Agg Bond TR EUR': '#304ffe',
  'BME IBEX 35 PR EUR': '#64dd17',
  'S&P 500 PR USD EUR': '#ff3d00',
}

export default function PortfolioChart() {
  const [showGrid, setShowGrid] = useState(true)
  const [showBaseline, setShowBaseline] = useState(true)
  const [smoothing, setSmoothing] = useState<SmoothingOption>('none')
  const [dateRange, setDateRange] = useState([0, 100])
  const [selectedFunds, setSelectedFunds] = useState<string[]>(funds)
  const [selectedIndexes, setSelectedIndexes] = useState<string[]>(indexes)
  const [viewType, setViewType] = useState('absolute')
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null)

  const selectedSeries = [...selectedFunds, ...selectedIndexes]

  const getSmoothedData = (data: ChartDataPoint[]): ChartDataPoint[] => {
    if (smoothing === 'none') return data;

    const windowSize = smoothing === 'weekly' ? 7 : 30;

    return data.map((_, index) => {
      const windowStart = Math.max(0, index - windowSize + 1);
      const window = data.slice(windowStart, index + 1);
      
      const smoothedPoint: ChartDataPoint = {
        date: data[index].date,
      };

      selectedSeries.forEach(series => {
        const values = window
          .map(d => d[series])
          .filter((v): v is number => typeof v === 'number');
        
        if (values.length > 0) {
          smoothedPoint[series] = values.reduce((a, b) => a + b, 0) / values.length;
        }
      });

      return smoothedPoint;
    });
  };

  const filteredData = useMemo(() => {
    const slicedData = sampleData.slice(
      Math.floor(sampleData.length * (dateRange[0] / 100)),
      Math.ceil(sampleData.length * (dateRange[1] / 100))
    );
    return getSmoothedData(slicedData);
  }, [dateRange, smoothing, selectedSeries]);

  const yDomain = useMemo(() => {
    if (!filteredData.length || !selectedSeries.length) return [0, 100]

    let min = Infinity
    let max = -Infinity

    filteredData.forEach((entry) => {
      selectedSeries.forEach((series) => {
        const value = entry[series]
        if (typeof value === 'number') {
          min = Math.min(min, value)
          max = Math.max(max, value)
        }
      })
    })

    const range = max - min
    const padding = range * 0.2
    
    const roundedMin = Math.floor((min - padding) / 20) * 20
    const roundedMax = Math.ceil((max + padding) / 20) * 20

    return [roundedMin, roundedMax]
  }, [filteredData, selectedSeries])

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <Image
            src="https://i0.wp.com/www.nextepfinance.com/wp-content/uploads/2020/07/logoPeq.png"
            alt="Nextep Finance Logo"
            width={120}
            height={40}
            className="object-contain"
            priority
          />
          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="View type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="absolute">Absolute</SelectItem>
              <SelectItem value="relative">Relative</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardTitle>Portfolio Performance Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-grid"
                checked={showGrid}
                onCheckedChange={setShowGrid}
              />
              <Label htmlFor="show-grid">Show Grid</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-baseline"
                checked={showBaseline}
                onCheckedChange={setShowBaseline}
              />
              <Label htmlFor="show-baseline">Show Baseline</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Label>Smoothing</Label>
              <Select value={smoothing} onValueChange={(value: SmoothingOption) => setSmoothing(value)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Smoothing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Funds</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFunds(Array.from(funds))}
                >
                  Show All Funds
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFunds([])}
                >
                  Hide All Funds
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {funds.map((fund) => (
                  <Button
                    key={fund}
                    variant={selectedFunds.includes(fund) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedFunds(prev =>
                        prev.includes(fund)
                          ? prev.filter(f => f !== fund)
                          : [...prev, fund]
                      )
                    }}
                    style={{
                      backgroundColor: selectedFunds.includes(fund) ? colors[fund] : 'transparent',
                      borderColor: colors[fund],
                      color: selectedFunds.includes(fund) ? 'white' : colors[fund],
                    }}
                  >
                    {fund.replace('Cartera Propuesta', '')}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Indexes</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIndexes(Array.from(indexes))}
                >
                  Show All Indexes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIndexes([])}
                >
                  Hide All Indexes
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {indexes.map((index) => (
                  <Button
                    key={index}
                    variant={selectedIndexes.includes(index) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedIndexes(prev =>
                        prev.includes(index)
                          ? prev.filter(i => i !== index)
                          : [...prev, index]
                      )
                    }}
                    style={{
                      backgroundColor: selectedIndexes.includes(index) ? colors[index] : 'transparent',
                      borderColor: colors[index],
                      color: selectedIndexes.includes(index) ? 'white' : colors[index],
                    }}
                  >
                    {index}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={filteredData}
                onMouseMove={(e: any) => {
                  if (e.isTooltipActive) {
                    setHoveredSeries(e.activePayload[0].dataKey)
                  } else {
                    setHoveredSeries(null)
                  }
                }}
                onMouseLeave={() => setHoveredSeries(null)}
                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
              >
                {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                <XAxis
                  dataKey="date"
                  tickFormatter={(date: Date) => {
                    return date.toLocaleDateString('en-GB', {
                      month: 'short',
                      year: '2-digit'
                    })
                  }}
                />
                <YAxis 
                  domain={yDomain}
                  tickCount={8}
                  tickFormatter={(value: number) => Number(value).toFixed(1)}
                />
                <Tooltip
                  labelFormatter={(date: Date) => {
                    return date.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  }}
                  formatter={(value: number, name: string) => [
                    Number(value).toFixed(2),
                    name.replace('Cartera Propuesta', '')
                  ]}
                />
                <Legend />
                {showBaseline && (
                  <ReferenceLine y={100} stroke="#666" strokeDasharray="3 3" />
                )}
                {selectedSeries.map((series) => (
                  <Line
                    key={series}
                    type="monotone"
                    dataKey={series}
                    stroke={colors[series]}
                    strokeWidth={hoveredSeries === series ? 4 : 2}
                    dot={false}
                    name={series.replace('Cartera Propuesta', '')}
                    opacity={hoveredSeries && hoveredSeries !== series ? 0.3 : 1}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Slider
              value={dateRange}
              onValueChange={setDateRange}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}