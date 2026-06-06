const { retryWithBackoff } = require('../../src/utils/retry');

// Suppress logger output during tests
jest.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

describe('retryWithBackoff', () => {
  it('returns result on first successful call', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue('success');

    const result = await retryWithBackoff(fn, { maxRetries: 3, baseDelay: 10 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting all retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('persistent failure'));
    await expect(
      retryWithBackoff(fn, { maxRetries: 2, baseDelay: 10 })
    ).rejects.toThrow('persistent failure');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('respects shouldRetry predicate', async () => {
    const nonRetryableError = new Error('non-retryable');
    nonRetryableError.status = 400;
    const fn = jest.fn().mockRejectedValue(nonRetryableError);

    await expect(
      retryWithBackoff(fn, {
        maxRetries: 3,
        baseDelay: 10,
        shouldRetry: (err) => err.status >= 500,
      })
    ).rejects.toThrow('non-retryable');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('respects maxDelay cap', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');

    const start = Date.now();
    await retryWithBackoff(fn, { maxRetries: 1, baseDelay: 10, maxDelay: 50 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(200);
  });
});
