import { describe, it, expect, vi } from 'vitest';
import { formatNumber, formatCurrency, formatModelsDisplay, formatModelsDisplayMultiline, pushBreakdownRows, formatUsageDataRow, formatTotalsRow, createUsageReportTable, addEmptySeparatorRow } from '../table.js';

describe('table.ts - formatNumber', () => {
  it('should format numbers with commas', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(10000)).toBe('10,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('should format 0 correctly', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('table.ts - formatCurrency', () => {
  it('should format currency with 2 decimal places', () => {
    expect(formatCurrency(10)).toBe('$10.00');
    expect(formatCurrency(10.5)).toBe('$10.50');
    expect(formatCurrency(10.554)).toBe('$10.55');
    expect(formatCurrency(10.556)).toBe('$10.56');
  });
});

describe('table.ts - formatModelsDisplay', () => {
  it('should format models as comma-separated string', () => {
    const models = ['claude-sonnet-4-20250514', 'claude-opus-4-20250514'];
    const result = formatModelsDisplay(models);
    expect(result).toContain('sonnet-4');
    expect(result).toContain('opus-4');
    expect(result).toMatch(/.*, .*/); // comma separated
  });

  it('should remove duplicates', () => {
    const models = ['claude-sonnet-4-20250514', 'claude-sonnet-4-20250514'];
    const result = formatModelsDisplay(models);
    const count = (result.match(/sonnet-4/g) || []).length;
    expect(count).toBe(1);
  });

  it('should sort alphabetically', () => {
    const models = ['claude-opus-4-20250514', 'claude-haiku-3-20241022'];
    const result = formatModelsDisplay(models);
    const haikuIndex = result.indexOf('haiku');
    const opusIndex = result.indexOf('opus');
    expect(haikuIndex).toBeLessThan(opusIndex);
  });
});

describe('table.ts - formatModelsDisplayMultiline', () => {
  it('should format models as bullet list', () => {
    const models = ['claude-sonnet-4-20250514', 'claude-opus-4-20250514'];
    const result = formatModelsDisplayMultiline(models);
    expect(result).toContain('- sonnet-4');
    expect(result).toContain('- opus-4');
    expect(result).toContain('\n'); // multiline
  });

  it('should remove duplicates', () => {
    const models = ['claude-sonnet-4-20250514', 'claude-sonnet-4-20250514'];
    const result = formatModelsDisplayMultiline(models);
    const count = (result.match(/sonnet-4/g) || []).length;
    expect(count).toBe(1);
  });
});

describe('table.ts - formatUsageDataRow', () => {
  it('should format usage data row correctly', () => {
    const data = {
      inputTokens: 1000,
      outputTokens: 2000,
      cacheCreationTokens: 500,
      cacheReadTokens: 1500,
      totalCost: 1.23,
      modelsUsed: ['claude-sonnet-4-20250514']
    };
    const result = formatUsageDataRow('2026-01-07', data);

    expect(result[0]).toBe('2026-01-07');
    expect(result[1]).toContain('sonnet-4');
    expect(result[2]).toBe('1,000');
    expect(result[3]).toBe('2,000');
    expect(result[4]).toBe('500');
    expect(result[5]).toBe('1,500');
    expect(result[6]).toBe('5,000');
    expect(result[7]).toBe('$1.23');
  });

  it('should include last activity when provided', () => {
    const data = {
      inputTokens: 1000,
      outputTokens: 2000,
      cacheCreationTokens: 500,
      cacheReadTokens: 1500,
      totalCost: 1.23,
      modelsUsed: ['claude-sonnet-4-20250514']
    };
    const result = formatUsageDataRow('2026-01-07', data, '2h ago');

    expect(result[8]).toBe('2h ago');
    expect(result.length).toBe(9);
  });

  it('should handle empty models', () => {
    const data = {
      inputTokens: 1000,
      outputTokens: 2000,
      cacheCreationTokens: 500,
      cacheReadTokens: 1500,
      totalCost: 1.23
    };
    const result = formatUsageDataRow('2026-01-07', data);

    expect(result[1]).toBe('');
  });
});

describe('table.ts - formatTotalsRow', () => {
  it('should format totals row with yellow styling', () => {
    const totals = {
      inputTokens: 10000,
      outputTokens: 20000,
      cacheCreationTokens: 5000,
      cacheReadTokens: 15000,
      totalCost: 12.34
    };
    const result = formatTotalsRow(totals);

    expect(result[0]).toContain('Total'); // yellow text
    expect(result[1]).toBe(''); // empty models column
    expect(result[2]).toContain('10,000');
    expect(result[7]).toContain('$12.34');
    expect(result.length).toBe(8);
  });

  it('should include empty last activity when requested', () => {
    const totals = {
      inputTokens: 10000,
      outputTokens: 20000,
      cacheCreationTokens: 5000,
      cacheReadTokens: 15000,
      totalCost: 12.34
    };
    const result = formatTotalsRow(totals, true);

    expect(result[8]).toBe('');
    expect(result.length).toBe(9);
  });
});

describe('table.ts - pushBreakdownRows', () => {
  it('should push breakdown rows with correct structure', () => {
    const mockTable = {
      push: vi.fn()
    };
    const breakdowns = [
      {
        modelName: 'claude-sonnet-4-20250514',
        inputTokens: 1000,
        outputTokens: 2000,
        cacheCreationTokens: 500,
        cacheReadTokens: 1500,
        cost: 1.23
      }
    ];

    pushBreakdownRows(mockTable as any, breakdowns, 1);

    expect(mockTable.push).toHaveBeenCalledTimes(1);
    const row = mockTable.push.mock.calls[0][0];
    expect(row[0]).toContain('└─');
    expect(row[0]).toContain('sonnet-4');
    expect(row[1]).toBe(''); // extra column
  });

  it('should push breakdown rows with extra columns', () => {
    const mockTable = {
      push: vi.fn()
    };
    const breakdowns = [
      {
        modelName: 'claude-sonnet-4-20250514',
        inputTokens: 1000,
        outputTokens: 2000,
        cacheCreationTokens: 500,
        cacheReadTokens: 1500,
        cost: 1.23
      }
    ];

    pushBreakdownRows(mockTable as any, breakdowns, 2);

    const row = mockTable.push.mock.calls[0][0];
    expect(row[0]).toContain('└─');
    expect(row[1]).toBe(''); // first extra column
    expect(row[2]).toBe(''); // second extra column
  });

  it('should calculate total tokens correctly', () => {
    const mockTable = {
      push: vi.fn()
    };
    const breakdowns = [
      {
        modelName: 'claude-sonnet-4-20250514',
        inputTokens: 1000,
        outputTokens: 2000,
        cacheCreationTokens: 500,
        cacheReadTokens: 1500,
        cost: 1.23
      }
    ];

    pushBreakdownRows(mockTable as any, breakdowns, 1);

    const row = mockTable.push.mock.calls[0][0];
    // Total tokens should be: 1000 + 2000 + 500 + 1500 = 5000
    expect(row[6]).toBe('5,000');
  });
});

describe('table.ts - createUsageReportTable', () => {
  it('should create table with correct structure', () => {
    const table = createUsageReportTable({ firstColumnName: 'Date' });

    expect(table).toBeDefined();
    const output = table.toString();
    expect(output).toBeTruthy();
    expect(table.isCompactMode()).toBe(false);
  });

  it('should force compact mode when requested', () => {
    const table = createUsageReportTable({ firstColumnName: 'Date', forceCompact: true });

    table.toString();
    expect(table.isCompactMode()).toBe(true);
  });
});

describe('table.ts - addEmptySeparatorRow', () => {
  it('should add empty separator row with correct number of columns', () => {
    const mockTable = {
      push: vi.fn()
    };

    addEmptySeparatorRow(mockTable as any, 8);

    expect(mockTable.push).toHaveBeenCalledTimes(1);
    const row = mockTable.push.mock.calls[0][0];
    expect(row.length).toBe(8);
    expect(row.every(cell => cell === '')).toBe(true);
  });
});

describe('table.ts - breakdown rows with instances grouping', () => {
  it('should handle breakdown rows with firstColumnEmpty for project grouping', () => {
    const mockTable = {
      push: vi.fn()
    };
    const breakdowns = [
      {
        modelName: 'claude-sonnet-4-20250514',
        inputTokens: 1000,
        outputTokens: 2000,
        cacheCreationTokens: 500,
        cacheReadTokens: 1500,
        cost: 1.23
      }
    ];

    pushBreakdownRows(mockTable as any, breakdowns, 0, 0, true);

    expect(mockTable.push).toHaveBeenCalledTimes(1);
    const row = mockTable.push.mock.calls[0][0];
    expect(row[0]).toBe('');
    expect(row[1]).toContain('└─');
    expect(row[1]).toContain('sonnet-4');
  });

  it('should handle breakdown rows without firstColumnEmpty for regular grouping', () => {
    const mockTable = {
      push: vi.fn()
    };
    const breakdowns = [
      {
        modelName: 'claude-sonnet-4-20250514',
        inputTokens: 1000,
        outputTokens: 2000,
        cacheCreationTokens: 500,
        cacheReadTokens: 1500,
        cost: 1.23
      }
    ];

    pushBreakdownRows(mockTable as any, breakdowns, 1, 0, false);

    expect(mockTable.push).toHaveBeenCalledTimes(1);
    const row = mockTable.push.mock.calls[0][0];
    expect(row[0]).toContain('└─');
    expect(row[0]).toContain('sonnet-4');
    expect(row[1]).toBe('');
  });

  it('should handle multiple breakdown rows with project grouping', () => {
    const mockTable = {
      push: vi.fn()
    };
    const breakdowns = [
      {
        modelName: 'claude-sonnet-4-20250514',
        inputTokens: 1000,
        outputTokens: 2000,
        cacheCreationTokens: 500,
        cacheReadTokens: 1500,
        cost: 1.23
      },
      {
        modelName: 'claude-opus-4-20250514',
        inputTokens: 500,
        outputTokens: 1000,
        cacheCreationTokens: 250,
        cacheReadTokens: 750,
        cost: 0.5
      }
    ];

    pushBreakdownRows(mockTable as any, breakdowns, 0, 0, true);

    expect(mockTable.push).toHaveBeenCalledTimes(2);
    const firstRow = mockTable.push.mock.calls[0][0];
    const secondRow = mockTable.push.mock.calls[1][0];

    expect(firstRow[0]).toBe('');
    expect(firstRow[1]).toContain('sonnet-4');

    expect(secondRow[0]).toBe('');
    expect(secondRow[1]).toContain('opus-4');
  });

  it('should handle empty breakdowns array', () => {
    const mockTable = {
      push: vi.fn()
    };

    pushBreakdownRows(mockTable as any, [], 0, 0, true);

    expect(mockTable.push).toHaveBeenCalledTimes(0);
  });

  it('should handle zero tokens and cost', () => {
    const mockTable = {
      push: vi.fn()
    };
    const breakdowns = [
      {
        modelName: 'claude-sonnet-4-20250514',
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        cost: 0
      }
    ];

    pushBreakdownRows(mockTable as any, breakdowns, 0, 0, true);

    expect(mockTable.push).toHaveBeenCalledTimes(1);
    const row = mockTable.push.mock.calls[0][0];
    expect(row[2]).toBe('0'); // input tokens
    expect(row[3]).toBe('0'); // output tokens
    expect(row[4]).toBe('0'); // cache creation
    expect(row[5]).toBe('0'); // cache read
    expect(row[6]).toBe('0'); // total tokens
    expect(row[7]).toBe('$0.00'); // cost
  });

  it('should handle different extraColumns values', () => {
    const mockTable = {
      push: vi.fn()
    };
    const breakdowns = [
      {
        modelName: 'claude-sonnet-4-20250514',
        inputTokens: 1000,
        outputTokens: 2000,
        cacheCreationTokens: 500,
        cacheReadTokens: 1500,
        cost: 1.23
      }
    ];

    pushBreakdownRows(mockTable as any, breakdowns, 3, 0, false);

    const row = mockTable.push.mock.calls[0][0];
    expect(row[0]).toContain('└─');
    expect(row[1]).toBe('');
    expect(row[2]).toBe('');
    expect(row[3]).toBe('');
  });

  it('should handle trailingColumns', () => {
    const mockTable = {
      push: vi.fn()
    };
    const breakdowns = [
      {
        modelName: 'claude-sonnet-4-20250514',
        inputTokens: 1000,
        outputTokens: 2000,
        cacheCreationTokens: 500,
        cacheReadTokens: 1500,
        cost: 1.23
      }
    ];

    pushBreakdownRows(mockTable as any, breakdowns, 0, 2, false);

    const row = mockTable.push.mock.calls[0][0];
    expect(row[row.length - 2]).toBe(''); // first trailing column
    expect(row[row.length - 1]).toBe(''); // second trailing column
  });

  it('should format model names that dont match pattern', () => {
    const mockTable = {
      push: vi.fn()
    };
    const breakdowns = [
      {
        modelName: 'custom-model-name',
        inputTokens: 1000,
        outputTokens: 2000,
        cacheCreationTokens: 500,
        cacheReadTokens: 1500,
        cost: 1.23
      }
    ];

    pushBreakdownRows(mockTable as any, breakdowns, 0, 0, false);

    const row = mockTable.push.mock.calls[0][0];
    expect(row[0]).toContain('custom-model-name'); // should return original name
  });
});
