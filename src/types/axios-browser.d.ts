declare module 'axios/dist/browser/axios.cjs' {
  import type {AxiosStatic} from 'axios';

  const axios: AxiosStatic;
  export default axios;
}
