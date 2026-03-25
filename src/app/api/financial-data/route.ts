import { NextResponse } from 'next/server';
import { mockFinancialData } from '@/lib/mockData';
import { FinancialDataResponse } from '@/lib/types';

export async function GET() {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';

  if (useMock) {
    const response: FinancialDataResponse = {
      data: mockFinancialData,
      source: 'mock',
    };
    return NextResponse.json(response);
  }

  // Mono integration placeholder — will be implemented in Phase 3
  // For now, fall back to mock
  const response: FinancialDataResponse = {
    data: mockFinancialData,
    source: 'mock',
  };
  return NextResponse.json(response);
}
