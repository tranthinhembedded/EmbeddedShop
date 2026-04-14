import {
  ApiClientError,
  getUserFriendlyErrorMessage,
  retryAsync,
  toApiClientError,
} from '../src/services/api';

describe('api error helpers', () => {
  test('normalizes network-like errors into retryable api errors', () => {
    const error = toApiClientError(new TypeError('Network request failed'));

    expect(error.code).toBe('NETWORK_UNAVAILABLE');
    expect(error.retryable).toBe(true);
    expect(getUserFriendlyErrorMessage(error)).toContain('Please check your connection');
  });

  test('retries a retryable task before succeeding', async () => {
    let attempt = 0;

    const result = await retryAsync(
      async () => {
        attempt += 1;

        if (attempt < 3) {
          throw new ApiClientError({
            code: 'SERVICE_UNAVAILABLE',
            message: 'Service unavailable',
            retryable: true,
          });
        }

        return 'ok';
      },
      {retries: 2, delayMs: 1, backoffMs: 0},
    );

    expect(result).toBe('ok');
    expect(attempt).toBe(3);
  });

  test('stops retrying when the error is not retryable', async () => {
    let attempt = 0;

    await expect(
      retryAsync(
        async () => {
          attempt += 1;
          throw new ApiClientError({
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            retryable: false,
          });
        },
        {retries: 3, delayMs: 1, backoffMs: 0},
      ),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(attempt).toBe(1);
  });
});
