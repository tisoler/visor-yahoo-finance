/* eslint-disable  @typescript-eslint/no-explicit-any */
import yahooFinance from 'yahoo-finance2';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('query') || '';
    const results = await yahooFinance.search(query, {
      quotesCount: 10,
      newsCount: 0,
    });

    // Format the results to include only stocks/ETFs
    const stocks = results.quotes
      .filter(quote => quote.isYahooFinance && ['EQUITY', 'ETF'].includes(quote.quoteType))
      .map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.name,
        exchange: quote.exchange,
        type: quote.quoteType,
      }));

    return NextResponse.json(stocks);
  } catch (error) {
    return NextResponse.json({ message: 'Error cargando activos: ' + error }, {status: 500});
  }
}
