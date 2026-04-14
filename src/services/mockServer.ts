import type {
  AxiosRequestConfig,
  AxiosResponseHeaders,
  RawAxiosResponseHeaders,
} from 'axios';

import {PRODUCTS} from '../catalog';
import {getJson, setJson} from './persistence';
import type {
  AuthSession,
  AuthTokens,
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  RefreshTokenPayload,
  RegisterPayload,
} from '../types/auth';
import type {
  ManagedProduct,
  ProductListParams,
  ProductListResponse,
  ProductMutationPayload,
} from '../types/productManagement';
import type {ApiError} from '../types/api';
import {delay} from '../utils/helpers';

type StoredUserRecord = AuthUser & {
  password: string;
};

type StoredSessionRecord = AuthTokens & {
  userId: string;
};

type PasswordResetRecord = {
  id: string;
  email: string;
  requestedAt: string;
};

type MockDatabase = {
  users: StoredUserRecord[];
  sessions: StoredSessionRecord[];
  products: ManagedProduct[];
  passwordResets: PasswordResetRecord[];
};

type MockRequest = {
  method: string;
  path: string;
  headers?: AxiosRequestConfig['headers'];
  params?: Record<string, unknown>;
  data?: unknown;
};

type MockResponse<T> = {
  status: number;
  data: T;
  headers?: AxiosResponseHeaders | RawAxiosResponseHeaders;
};

type ProductMutationResponse = {
  product: ManagedProduct;
  message: string;
};

const DB_KEY = 'embeddedshop.mock-backend.v1';
const ACCESS_TOKEN_TTL_MS = 1000 * 60 * 12;

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createToken = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

const nowIso = () => new Date().toISOString();

const toManagedSeedProduct = (index: number, product: (typeof PRODUCTS)[number]): ManagedProduct => {
  const createdAt = new Date(Date.now() - (index + 1) * 86400000).toISOString();
  const updatedAt = new Date(Date.now() - index * 3600000).toISOString();

  return {
    id: product.id,
    sku: product.code,
    name: product.name,
    description: `${product.overview}\n\nApplications: ${product.applications.join(', ')}.`,
    price: product.price,
    category: product.category,
    tags: product.tags,
    images: [
      {
        id: `${product.id}-image-1`,
        uri: `https://placehold.co/640x480/102434/F3FAFF.png?text=${encodeURIComponent(
          product.code,
        )}`,
        name: `${product.code}-hero.png`,
        sizeInMb: 1.2,
      },
      {
        id: `${product.id}-image-2`,
        uri: `https://placehold.co/640x480/143447/FFFFFF.png?text=${encodeURIComponent(
          product.vendor,
        )}`,
        name: `${product.code}-detail.png`,
        sizeInMb: 1.4,
      },
    ],
    stockQuantity: product.stock,
    createdAt,
    updatedAt,
  };
};

const createSeedDatabase = (): MockDatabase => {
  const users: StoredUserRecord[] = [
    {
      id: 'user-admin',
      fullName: 'EmbeddedShop Admin',
      email: 'admin@embeddedshop.app',
      phone: '0900000001',
      role: 'admin',
      createdAt: '2026-01-08T08:00:00.000Z',
      password: 'EmbeddedShop123',
    },
    {
      id: 'user-demo',
      fullName: 'Demo Operator',
      email: 'demo@embeddedshop.app',
      phone: '0900000002',
      role: 'member',
      createdAt: '2026-01-09T10:00:00.000Z',
      password: 'Demo1234',
    },
  ];

  return {
    users,
    sessions: [],
    products: PRODUCTS.slice(0, 12).map((product, index) =>
      toManagedSeedProduct(index, product),
    ),
    passwordResets: [],
  };
};

const loadDatabase = (): MockDatabase => {
  const stored = getJson<MockDatabase>(DB_KEY);

  if (stored) {
    return stored;
  }

  const seeded = createSeedDatabase();
  setJson(DB_KEY, seeded);
  return seeded;
};

const saveDatabase = (database: MockDatabase) => {
  setJson(DB_KEY, database);
};

const toPublicUser = (user: StoredUserRecord): AuthUser => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
});

const createSessionForUser = (userId: string): StoredSessionRecord => ({
  userId,
  accessToken: createToken('access'),
  refreshToken: createToken('refresh'),
  expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString(),
});

const toAuthSession = (user: StoredUserRecord, session: StoredSessionRecord): AuthSession => ({
  user: toPublicUser(user),
  tokens: {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
  },
});

const parseBearerToken = (headers?: AxiosRequestConfig['headers']) => {
  if (!headers) {
    return null;
  }

  const authorization =
    (typeof (headers as Record<string, unknown>).Authorization === 'string'
      ? (headers as Record<string, string>).Authorization
      : undefined) ??
    (typeof (headers as Record<string, unknown>).authorization === 'string'
      ? (headers as Record<string, string>).authorization
      : undefined);

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice(7);
};

const normalizePath = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  }

  return url.startsWith('/') ? url : `/${url}`;
};

const parseData = <T,>(payload: unknown): T => {
  if (typeof payload === 'string') {
    return JSON.parse(payload) as T;
  }

  return (payload ?? {}) as T;
};

const buildError = (error: ApiError): never => {
  throw error;
};

const ensureValue = <T,>(value: T | null | undefined, error: ApiError): T => {
  if (value === null || value === undefined) {
    buildError(error);
  }

  return value as T;
};

const requireSession = (request: MockRequest) => {
  const token = parseBearerToken(request.headers);

  if (!token) {
    buildError({
      code: 'AUTH_REQUIRED',
      message: 'Authentication is required.',
      status: 401,
      userMessage: 'Please sign in to continue.',
    });
  }

  const database = loadDatabase();
  const session = ensureValue(
    database.sessions.find(item => item.accessToken === token),
    {
      code: 'INVALID_TOKEN',
      message: 'Access token is invalid.',
      status: 401,
      userMessage: 'Your session is no longer valid. Please sign in again.',
    },
  );

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    buildError({
      code: 'TOKEN_EXPIRED',
      message: 'Access token expired.',
      status: 401,
      userMessage: 'Your session expired. Refreshing your access token now.',
    });
  }

  const user = ensureValue(database.users.find(item => item.id === session.userId), {
    code: 'AUTH_USER_MISSING',
    message: 'User not found.',
    status: 401,
    userMessage: 'The signed-in user could not be found anymore.',
  });

  return {database, session, user};
};

const filterProducts = (
  products: ManagedProduct[],
  {query = '', category = 'all', sortBy = 'updated-desc'}: ProductListParams,
) => {
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = products.filter(product => {
    const matchesQuery =
      !normalizedQuery ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.sku.toLowerCase().includes(normalizedQuery) ||
      product.tags.some(tag => tag.toLowerCase().includes(normalizedQuery));

    const matchesCategory = category === 'all' || product.category === category;

    return matchesQuery && matchesCategory;
  });

  return filtered.sort((left, right) => {
    switch (sortBy) {
      case 'price-asc':
        return left.price - right.price;
      case 'price-desc':
        return right.price - left.price;
      case 'updated-asc':
        return left.updatedAt.localeCompare(right.updatedAt);
      case 'stock-desc':
        return right.stockQuantity - left.stockQuantity;
      case 'updated-desc':
      default:
        return right.updatedAt.localeCompare(left.updatedAt);
    }
  });
};

const listProducts = (request: MockRequest): MockResponse<ProductListResponse> => {
  const {database} = requireSession(request);
  const params = (request.params ?? {}) as Record<string, string | number | undefined>;
  const page = Number(params.page ?? 1);
  const pageSize = Number(params.pageSize ?? 6);
  const filtered = filterProducts(database.products, {
    query: typeof params.query === 'string' ? params.query : '',
    category:
      typeof params.category === 'string'
        ? (params.category as ProductListParams['category'])
        : 'all',
    sortBy:
      typeof params.sortBy === 'string'
        ? (params.sortBy as ProductListParams['sortBy'])
        : 'updated-desc',
  });
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;

  return {
    status: 200,
    data: {
      items: filtered.slice(startIndex, startIndex + pageSize),
      page: safePage,
      pageSize,
      total,
      totalPages,
    },
  };
};

const getProductById = (request: MockRequest): MockResponse<{product: ManagedProduct}> => {
  const {database} = requireSession(request);
  const productId = request.path.split('/').pop();
  const product = ensureValue(database.products.find(item => item.id === productId), {
    code: 'PRODUCT_NOT_FOUND',
    message: 'Product could not be found.',
    status: 404,
    userMessage: 'The product record could not be found.',
  });

  return {
    status: 200,
    data: {product},
  };
};

const assertUniqueSku = (
  products: ManagedProduct[],
  sku: string,
  productId?: string,
) => {
  const normalizedSku = sku.trim().toUpperCase();
  const duplicated = products.some(
    product =>
      product.sku.trim().toUpperCase() === normalizedSku &&
      product.id !== productId,
  );

  if (duplicated) {
    buildError({
      code: 'SKU_ALREADY_EXISTS',
      message: 'SKU must be unique.',
      status: 409,
      userMessage: 'That SKU already exists. Please choose another one.',
    });
  }
};

const createProduct = (request: MockRequest): MockResponse<ProductMutationResponse> => {
  const {database} = requireSession(request);
  const payload = parseData<ProductMutationPayload>(request.data);

  assertUniqueSku(database.products, payload.sku);

  const product: ManagedProduct = {
    id: createId('product'),
    sku: payload.sku.trim().toUpperCase(),
    name: payload.name.trim(),
    description: payload.description.trim(),
    price: payload.price,
    category: payload.category,
    tags: payload.tags,
    images: payload.images,
    stockQuantity: payload.stockQuantity,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  database.products = [product, ...database.products];
  saveDatabase(database);

  return {
    status: 201,
    data: {
      product,
      message: 'Product created successfully.',
    },
  };
};

const updateProduct = (request: MockRequest): MockResponse<ProductMutationResponse> => {
  const {database} = requireSession(request);
  const productId = request.path.split('/').pop();
  const payload = parseData<ProductMutationPayload>(request.data);
  const productIndex = database.products.findIndex(item => item.id === productId);

  if (productIndex < 0) {
    buildError({
      code: 'PRODUCT_NOT_FOUND',
      message: 'Product could not be found.',
      status: 404,
      userMessage: 'The product record could not be found.',
    });
  }

  assertUniqueSku(database.products, payload.sku, productId);

  const current = database.products[productIndex];
  const updated: ManagedProduct = {
    ...current,
    sku: payload.sku.trim().toUpperCase(),
    name: payload.name.trim(),
    description: payload.description.trim(),
    price: payload.price,
    category: payload.category,
    tags: payload.tags,
    images: payload.images,
    stockQuantity: payload.stockQuantity,
    updatedAt: nowIso(),
  };

  database.products[productIndex] = updated;
  saveDatabase(database);

  return {
    status: 200,
    data: {
      product: updated,
      message: 'Product updated successfully.',
    },
  };
};

const deleteProduct = (request: MockRequest): MockResponse<{id: string; message: string}> => {
  const {database} = requireSession(request);
  const productId = request.path.split('/').pop();
  const beforeCount = database.products.length;
  database.products = database.products.filter(item => item.id !== productId);

  if (database.products.length === beforeCount) {
    buildError({
      code: 'PRODUCT_NOT_FOUND',
      message: 'Product could not be found.',
      status: 404,
      userMessage: 'The product record could not be found.',
    });
  }

  saveDatabase(database);

  return {
    status: 200,
    data: {
      id: productId ?? '',
      message: 'Product deleted successfully.',
    },
  };
};

const login = (request: MockRequest): MockResponse<AuthSession> => {
  const database = loadDatabase();
  const payload = parseData<LoginPayload>(request.data);
  const user = ensureValue(
    database.users.find(
      item => item.email.toLowerCase() === payload.email.trim().toLowerCase(),
    ),
    {
      code: 'INVALID_CREDENTIALS',
      message: 'Email or password is incorrect.',
      status: 401,
      userMessage: 'Email or password is incorrect.',
    },
  );

  if (user.password !== payload.password) {
    buildError({
      code: 'INVALID_CREDENTIALS',
      message: 'Email or password is incorrect.',
      status: 401,
      userMessage: 'Email or password is incorrect.',
    });
  }

  database.sessions = database.sessions.filter(session => session.userId !== user.id);
  const session = createSessionForUser(user.id);
  database.sessions.unshift(session);
  saveDatabase(database);

  return {
    status: 200,
    data: toAuthSession(user, session),
  };
};

const register = (request: MockRequest): MockResponse<AuthSession> => {
  const database = loadDatabase();
  const payload = parseData<RegisterPayload>(request.data);
  const normalizedEmail = payload.email.trim().toLowerCase();
  const normalizedPhone = payload.phone.trim();

  if (database.users.some(user => user.email.toLowerCase() === normalizedEmail)) {
    buildError({
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'Email address already exists.',
      status: 409,
      userMessage: 'That email address is already in use.',
    });
  }

  if (database.users.some(user => user.phone === normalizedPhone)) {
    buildError({
      code: 'PHONE_ALREADY_EXISTS',
      message: 'Phone number already exists.',
      status: 409,
      userMessage: 'That phone number is already in use.',
    });
  }

  const user: StoredUserRecord = {
    id: createId('user'),
    fullName: payload.fullName.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    role: 'member',
    createdAt: nowIso(),
    password: payload.password,
  };

  const session = createSessionForUser(user.id);

  database.users.unshift(user);
  database.sessions = database.sessions.filter(item => item.userId !== user.id);
  database.sessions.unshift(session);
  saveDatabase(database);

  return {
    status: 201,
    data: toAuthSession(user, session),
  };
};

const forgotPassword = (
  request: MockRequest,
): MockResponse<{message: string}> => {
  const database = loadDatabase();
  const payload = parseData<ForgotPasswordPayload>(request.data);

  database.passwordResets.unshift({
    id: createId('reset'),
    email: payload.email.trim().toLowerCase(),
    requestedAt: nowIso(),
  });
  database.passwordResets = database.passwordResets.slice(0, 20);
  saveDatabase(database);

  return {
    status: 200,
    data: {
      message:
        'If the email exists in EmbeddedShop, a reset link has been queued to the inbox.',
    },
  };
};

const logout = (request: MockRequest): MockResponse<{message: string}> => {
  const database = loadDatabase();
  const token = parseBearerToken(request.headers);
  const refreshToken = parseData<{refreshToken?: string}>(request.data).refreshToken;

  database.sessions = database.sessions.filter(
    session =>
      session.accessToken !== token && session.refreshToken !== refreshToken,
  );
  saveDatabase(database);

  return {
    status: 200,
    data: {
      message: 'Signed out successfully.',
    },
  };
};

const refreshToken = (request: MockRequest): MockResponse<AuthSession> => {
  const database = loadDatabase();
  const payload = parseData<RefreshTokenPayload>(request.data);
  const sessionIndex = database.sessions.findIndex(
    session => session.refreshToken === payload.refreshToken,
  );

  if (sessionIndex < 0) {
    buildError({
      code: 'REFRESH_TOKEN_INVALID',
      message: 'Refresh token is invalid.',
      status: 401,
      userMessage: 'Your session expired. Please sign in again.',
    });
  }

  const session = ensureValue(database.sessions[sessionIndex], {
    code: 'REFRESH_TOKEN_INVALID',
    message: 'Refresh token is invalid.',
    status: 401,
    userMessage: 'Your session expired. Please sign in again.',
  });
  const user = ensureValue(database.users.find(item => item.id === session.userId), {
    code: 'AUTH_USER_MISSING',
    message: 'User not found.',
    status: 401,
    userMessage: 'The signed-in user could not be found anymore.',
  });

  const nextSession: StoredSessionRecord = {
    ...session,
    accessToken: createToken('access'),
    expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString(),
  };

  database.sessions[sessionIndex] = nextSession;
  saveDatabase(database);

  return {
    status: 200,
    data: toAuthSession(user, nextSession),
  };
};

export async function handleMockRequest(
  request: MockRequest,
): Promise<MockResponse<unknown>> {
  await delay(260);

  const path = normalizePath(request.path);
  const [pathname] = path.split('?');
  const method = request.method.toUpperCase();

  if (pathname === '/auth/login' && method === 'POST') {
    return login(request);
  }

  if (pathname === '/auth/register' && method === 'POST') {
    return register(request);
  }

  if (pathname === '/auth/forgot-password' && method === 'POST') {
    return forgotPassword(request);
  }

  if (pathname === '/auth/logout' && method === 'POST') {
    return logout(request);
  }

  if (pathname === '/auth/refresh' && method === 'POST') {
    return refreshToken(request);
  }

  if (pathname === '/products' && method === 'GET') {
    return listProducts(request);
  }

  if (pathname === '/products' && method === 'POST') {
    return createProduct(request);
  }

  if (/^\/products\/[^/]+$/.test(pathname) && method === 'GET') {
    return getProductById({...request, path: pathname});
  }

  if (/^\/products\/[^/]+$/.test(pathname) && method === 'PUT') {
    return updateProduct({...request, path: pathname});
  }

  if (/^\/products\/[^/]+$/.test(pathname) && method === 'DELETE') {
    return deleteProduct({...request, path: pathname});
  }

  return buildError({
    code: 'MOCK_ROUTE_NOT_FOUND',
    message: `${method} ${pathname} is not implemented in the mock API.`,
    status: 404,
    userMessage: 'That API route is not available in the mock backend.',
  });
}
