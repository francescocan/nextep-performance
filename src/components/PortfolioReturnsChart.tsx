import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import * as XLSX from 'xlsx';
import { Calendar, ChevronDown } from 'lucide-react';

const PortfolioReturnsChart = () => {
  const [rawData, setRawData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolios, setSelectedPortfolios] = useState([]);
  const [dateRange, setDateRange] = useState([0, 100]); // Percentage of total date range
  const [showGrid, setShowGrid] = useState(true);
  const [showBaseline, setShowBaseline] = useState(true);
  const [valueType, setValueType] = useState('absolute'); // 'absolute' or 'relative'
  const [smoothing, setSmoothing] = useState(1); // Number of days for moving average
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Attempting to read Excel file...');
        const response = await fetch('/data/11122024 Rentabilidades diarias Carteras.xlsx');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        console.log('File fetched successfully, parsing data...');

        const workbook = XLSX.read(new Uint8Array(arrayBuffer), {
          type: 'array',
          cellDates: true,
          cellNF: true,
          cellStyles: true
        });
        
        if (!workbook.SheetNames.length) {
          throw new Error('No sheets found in the Excel file');
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        if (!jsonData.length) {
          throw new Error('No data found in the Excel sheet');
        }

        console.log('Data parsed successfully, processing...');

        // Extract portfolio names
        const portfolioNames = jsonData.slice(1)
          .map(row => row[0])
          .filter(name => name && typeof name === 'string');
        
        if (!portfolioNames.length) {
          throw new Error('No portfolio names found in the data');
        }

        setPortfolios(portfolioNames);
        setSelectedPortfolios(portfolioNames);

        // Process data
        const dates = jsonData[0].slice(1);
        const processedData = dates.map((date, index) => {
          if (!date) return null;
          
          const dataPoint = {
            date: date instanceof Date ? date : new Date(date),
          };
          
          portfolioNames.forEach((portfolio, portfolioIndex) => {
            const value = jsonData[portfolioIndex + 1][index + 1];
            if (typeof value === 'number' && !isNaN(value)) {
              dataPoint[portfolio] = value;
              // Calculate relative values (percentage change from start)
              if (index === 0) {
                dataPoint[`${portfolio}_relative`] = 0;
              } else {
                const startValue = jsonData[portfolioIndex + 1][1];
                dataPoint[`${portfolio}_relative`] = ((value - startValue) / startValue) * 100;
              }
            }
          });
          
          return dataPoint;
        }).filter(item => item !== null);

        console.log('Data processed successfully');
        setRawData(processedData);
        setDisplayData(processedData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError(error.message || 'An unknown error occurred while loading data');
      }
    };

    loadData();
  }, []);

  // Update display data when filters change
  useEffect(() => {
    if (!rawData.length) return;

    let filtered = [...rawData];

    // Apply date range filter
    const startIdx = Math.floor(rawData.length * (dateRange[0] / 100));
    const endIdx = Math.floor(rawData.length * (dateRange[1] / 100));
    filtered = filtered.slice(startIdx, endIdx);

    // Apply smoothing (moving average)
    if (smoothing > 1) {
      filtered = filtered.map((point, idx) => {
        const result = { date: point.date };
        const window = filtered.slice(Math.max(0, idx - smoothing + 1), idx + 1);
        
        portfolios.forEach(portfolio => {
          // Calculate smoothed values for both absolute and relative
          const absValues = window.map(w => w[portfolio]).filter(v => typeof v === 'number');
          result[portfolio] = absValues.reduce((a, b) => a + b, 0) / absValues.length;
          
          const relValues = window.map(w => w[`${portfolio}_relative`]).filter(v => typeof v === 'number');
          result[`${portfolio}_relative`] = relValues.reduce((a, b) => a + b, 0) / relValues.length;
        });
        
        return result;
      });
    }

    setDisplayData(filtered);
  }, [rawData, dateRange, smoothing]);

  // Color scheme for different portfolios
  const colors = ['#2563eb', '#16a34a', '#ea580c', '#9333ea'];

  const togglePortfolio = (portfolio) => {
    setSelectedPortfolios(prev => 
      prev.includes(portfolio)
        ? prev.filter(p => p !== portfolio)
        : [...prev, portfolio]
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Portfolio Performance Over Time</span>
          <div className="flex items-center space-x-4">
            <Select value={valueType} onValueChange={setValueType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="absolute">Absolute</SelectItem>
                <SelectItem value="relative">Relative (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Label>Show Grid</Label>
              <Switch
                checked={showGrid}
                onCheckedChange={setShowGrid}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label>Show Baseline</Label>
              <Switch
                checked={showBaseline}
                onCheckedChange={setShowBaseline}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label>Smoothing</Label>
              <Select 
                value={smoothing.toString()} 
                onValueChange={(value) => setSmoothing(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select smoothing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">None</SelectItem>
                  <SelectItem value="7">Weekly</SelectItem>
                  <SelectItem value="30">Monthly</SelectItem>
                  <SelectItem value="90">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          <div className="space-y-4">
            {/* Funds Section */}
            <div className="space-y-2">
              <Label>Funds</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPortfolios(prev => 
                    [...new Set([...prev, ...portfolios.filter(p => p.includes('Fondos'))])]
                  )}
                  className="text-xs"
                >
                  Show All Funds
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedPortfolios(prev => 
                    prev.filter(p => !p.includes('Fondos'))
                  )}
                  className="text-xs"
                >
                  Hide All Funds
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {portfolios
                  .filter(portfolio => portfolio.includes('Fondos'))
                  .map((portfolio, index) => (
                    <Button
                      key={portfolio}
                      variant={selectedPortfolios.includes(portfolio) ? "default" : "outline"}
                      onClick={() => togglePortfolio(portfolio)}
                      className="text-xs"
                      style={{
                        borderColor: colors[index % colors.length],
                        color: selectedPortfolios.includes(portfolio) ? 'white' : colors[index % colors.length],
                        backgroundColor: selectedPortfolios.includes(portfolio) ? colors[index % colors.length] : 'transparent'
                      }}
                    >
                      {portfolio.replace('Fondos ', '')}
                    </Button>
                ))}
              </div>
            </div>

            {/* Indexes Section */}
            <div className="space-y-2">
              <Label>Indexes</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPortfolios(prev => 
                    [...new Set([...prev, ...portfolios.filter(p => !p.includes('Fondos'))])]
                  )}
                  className="text-xs"
                >
                  Show All Indexes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedPortfolios(prev => 
                    prev.filter(p => p.includes('Fondos'))
                  )}
                  className="text-xs"
                >
                  Hide All Indexes
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {portfolios
                  .filter(portfolio => !portfolio.includes('Fondos'))
                  .map((portfolio, index) => (
                    <Button
                      key={portfolio}
                      variant={selectedPortfolios.includes(portfolio) ? "default" : "outline"}
                      onClick={() => togglePortfolio(portfolio)}
                      className="text-xs"
                      style={{
                        borderColor: colors[(index + portfolios.filter(p => p.includes('Fondos')).length) % colors.length],
                        color: selectedPortfolios.includes(portfolio) ? 'white' : colors[(index + portfolios.filter(p => p.includes('Fondos')).length) % colors.length],
                        backgroundColor: selectedPortfolios.includes(portfolio) ? colors[(index + portfolios.filter(p => p.includes('Fondos')).length) % colors.length] : 'transparent'
                      }}
                    >
                      {portfolio}
                    </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={displayData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => {
                    if (!(date instanceof Date)) return '';
                    return date.toLocaleDateString('en-GB', { 
                      month: 'short',
                      year: '2-digit'
                    });
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => valueType === 'absolute' 
                    ? value.toFixed(0)
                    : `${value.toFixed(1)}%`
                  }
                />
                <Tooltip
                  labelFormatter={(date) => {
                    if (!(date instanceof Date)) return '';
                    return date.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                  }}
                  formatter={(value, name) => [
                    valueType === 'absolute' 
                      ? value.toFixed(2)
                      : `${value.toFixed(2)}%`,
                    name.replace('Fondos ', '')
                  ]}
                />
                <Legend />
                {showBaseline && (
                  <ReferenceLine 
                    y={valueType === 'relative' ? 0 : 100} 
                    stroke="#666" 
                    strokeDasharray="3 3" 
                    label={valueType === 'relative' ? "0% change" : "Base value (100)"}
                  />
                )}
                {selectedPortfolios.map((portfolio, index) => (
                  <Line
                    key={portfolio}
                    type="monotone"
                    dataKey={valueType === 'absolute' ? portfolio : `${portfolio}_relative`}
                    stroke={colors[index % colors.length]}
                    dot={false}
                    strokeWidth={2}
                    name={portfolio.replace('Fondos ', '')}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

if (error) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Error Loading Data</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-red-500">{error}</p>
        <p>Please check the console for more details.</p>
      </CardContent>
    </Card>
  );
}

export default PortfolioReturnsChart;

