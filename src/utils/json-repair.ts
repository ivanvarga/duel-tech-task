import { logger } from './logger';

export interface RepairResult {
  success: boolean;
  data?: any;
  repaired: boolean;
  error?: string;
  repairs?: string[];
}

function removeTrailingCommas(data: string): { result: string; changed: boolean } {
  const pattern = /,(\s*[}\]])/g;
  const result = data.replace(pattern, '$1');
  return { result, changed: result !== data };
}

function isQuoteEscaped(data: string, quoteIndex: number): boolean {
  let backslashCount = 0;
  let i = quoteIndex - 1;
  while (i >= 0 && data[i] === '\\') {
    backslashCount++;
    i--;
  }
  return backslashCount % 2 === 1;
}

function skipString(data: string, startIndex: number): number {
  let i = startIndex + 1;
  while (i < data.length) {
    if (data[i] === '"' && !isQuoteEscaped(data, i)) {
      return i;
    }
    i++;
  }
  return i;
}

function findUnclosedBrackets(data: string): string[] {
  const openBrackets: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const char = data[i];

    if (char === '"') {
      i = skipString(data, i);
      continue;
    }

    if (char === '{' || char === '[') {
      openBrackets.push(char);
    } else if (char === '}' && openBrackets[openBrackets.length - 1] === '{') {
      openBrackets.pop();
    } else if (char === ']' && openBrackets[openBrackets.length - 1] === '[') {
      openBrackets.pop();
    }
  }

  return openBrackets;
}

function generateClosingBrackets(unclosedBrackets: string[]): string {
  return unclosedBrackets
    .reverse()
    .map(opener => opener === '{' ? '}' : ']')
    .join('\n');
}

export function repairJSONStructure(rawData: string): RepairResult {
  const repairs: string[] = [];
  let repairedData = rawData.trim();

  const trailingCommasResult = removeTrailingCommas(repairedData);
  if (trailingCommasResult.changed) {
    repairedData = trailingCommasResult.result;
    repairs.push('removed_trailing_commas');
  }

  const unclosedBrackets = findUnclosedBrackets(repairedData);
  if (unclosedBrackets.length > 0) {
    const closingBrackets = generateClosingBrackets(unclosedBrackets);
    repairedData = repairedData.trimEnd() + '\n' + closingBrackets;
    repairs.push(`balanced_${unclosedBrackets.length}_brackets`);
  }

  try {
    const parsed = JSON.parse(repairedData);

    if (repairs.length > 0) {
      logger.info(`JSON structure repaired: ${repairs.join(', ')}`);
    }

    return {
      success: true,
      data: parsed,
      repaired: repairs.length > 0,
      repairs: repairs.length > 0 ? repairs : undefined
    };
  } catch (error) {
    return {
      success: false,
      repaired: repairs.length > 0,
      error: error instanceof Error ? error.message : 'Unknown parse error',
      repairs: repairs.length > 0 ? repairs : undefined
    };
  }
}

export function parseJSON(rawData: string): RepairResult {
  try {
    const parsed = JSON.parse(rawData);
    return {
      success: true,
      data: parsed,
      repaired: false
    };
  } catch (_error) {
  }

  return repairJSONStructure(rawData);
}
