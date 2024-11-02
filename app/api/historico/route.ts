/* eslint-disable  @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function POST(request: Request) {
  const { symbol, fromDate, toDate } = await request.json();

  if (!symbol || !fromDate || !toDate) {
    return NextResponse.json({ message: 'Faltan campos en el request.' }, {status: 500});
  }

  try {
    const queryOptions = {
      period1: fromDate,
      period2: toDate,
      interval: '1d',
    } as any;

    const result = await yahooFinance.historical(symbol, queryOptions);

    // Format the data
    const formattedData = result?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())?.map(item => ({
      date: item.date.toISOString().split('T')[0],
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      adjClose: item.adjClose,
      volume: item.volume,
    })) || [];

    return NextResponse.json(formattedData);
  } catch (error) {
    return NextResponse.json({ message: 'Error recuperando datos históricos: ' + error }, {status: 500});
  }
}
