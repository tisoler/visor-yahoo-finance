/* eslint-disable  @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import { 
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Autocomplete,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import dayjs, { Dayjs } from 'dayjs';

const StockHistoryViewer = () => {
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(dayjs().subtract(1, 'month'));
  const [dateTo, setDateTo] = useState<Dayjs | null>(dayjs());
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [stockData, setStockData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Debounce search function
  const debounce = (func: any, wait: any) => {
    let timeout: any;
    return (...args: any) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const searchStocks = async (query: any) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/activos?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Error obteniendo activos');
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Error obteniendo activos:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Create debounced search function
  const debouncedSearch = React.useCallback(
    debounce((query: any) => searchStocks(query), 300),
    []
  );

  // Handle search input change
  const handleSearchChange = (_: any, newInputValue: string) => {
    setSearchInput(newInputValue);
    debouncedSearch(newInputValue);
  };

  const fetchStockData = async () => {
    if (!selectedStock || !dateFrom || !dateTo) {
      setError('Por favor, complete los campos.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/historico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: selectedStock?.symbol,
          fromDate: dateFrom.format('YYYY-MM-DD'),
          toDate: dateTo.format('YYYY-MM-DD'),
        }),
      });

      if (!response.ok) {
        throw new Error('Error recuperando datos históricos.');
      }

      const data = await response.json();
      setStockData(data);
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!stockData.length) return;

    const headers = Object.keys(stockData[0]);
    const csvContent = [
      headers.join(','),
      ...stockData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedStock.symbol}_${dateFrom?.format('YYYY-MM-DD')}_${dateTo?.format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper elevation={3} sx={{ p: 3, maxWidth: 1200, margin: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Precios históricos de stocks
        </Typography>

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, mb: 3 }}>
          <Autocomplete
            options={searchResults}
            getOptionLabel={(option) => `${option.symbol} - ${option.name}`}
            renderOption={(props, option) => {
              delete props['key'];
              return (
                // @ts-ignore
                <li key={option.symbol} {...props}>
                  <Box>
                    <Typography component="span" fontWeight="bold">
                      {option.symbol}
                    </Typography>
                    <Typography component="span" ml={1} color="text.secondary">
                      {option.name}
                    </Typography>
                    <Typography component="span" ml={1} color="text.secondary" fontSize="small">
                      ({option.exchange})
                    </Typography>
                  </Box>
                </li>
              )
            }
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar stocks"
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isSearching && <CircularProgress size={20} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            value={selectedStock}
            onChange={(_, newValue) => {
              setStockData([]);
              setSelectedStock(newValue);
            }}
            onInputChange={handleSearchChange}
            loading={isSearching}
            loadingText="Buscando..."
            noOptionsText={searchInput.length < 2 ? "Escriba para buscar..." : "No hay resultados"}
            isOptionEqualToValue={(option, value) => option.symbol === value?.symbol}
          />

          <DatePicker
            label="From Date"
            value={dateFrom}
            onChange={setDateFrom}
            slotProps={{ textField: { variant: 'outlined' } }}
          />

          <DatePicker
            label="To Date"
            value={dateTo}
            onChange={setDateTo}
            slotProps={{ textField: { variant: 'outlined' } }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            onClick={fetchStockData}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <SearchIcon />}
          >
            {isLoading ? 'Cargando...' : 'Obtener datos'}
          </Button>

          {stockData.length > 0 && (
            <Button
              variant="outlined"
              onClick={downloadCSV}
              startIcon={<DownloadIcon />}
            >
              Descargar CSV
            </Button>
          )}
        </Box>

        {stockData.length > 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Open</TableCell>
                  <TableCell align="right">High</TableCell>
                  <TableCell align="right">Low</TableCell>
                  <TableCell align="right">Close</TableCell>
                  <TableCell align="right">Adj Close</TableCell>
                  <TableCell align="right">Volume</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stockData.map((row: any, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell align="right">{row.open.toFixed(2)}</TableCell>
                    <TableCell align="right">{row.high.toFixed(2)}</TableCell>
                    <TableCell align="right">{row.low.toFixed(2)}</TableCell>
                    <TableCell align="right">{row.close.toFixed(2)}</TableCell>
                    <TableCell align="right">{row.adjClose.toFixed(2)}</TableCell>
                    <TableCell align="right">{row.volume.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </LocalizationProvider>
  );
};

export default StockHistoryViewer;
