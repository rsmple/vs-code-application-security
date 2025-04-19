import {ApiError, ApiErrorCancel, encodeQueryParams} from 'eco-vue-js/dist/utils/api'

import {getPortalUrl, getSettings} from '@/models/Settings'
import {SETTINGS_KEY_CAP} from '@/package'
import {showErrorMessage} from '@/providers/TreeDataProviderFinding'
import {outputChannel} from '@/utils/OutputChannel'

export const getURLParams = (params: RequestConfig['params']): string => {
  return new URLSearchParams(encodeQueryParams(params) as Record<string, string>).toString()
}

export const BASE_URL = '/api/v1'

const HEADERS_JSON: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
}

const HEADERS_FORMDATA: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
}

function doFetch<R, D extends RequestData>(method: string, url: string, config?: RequestConfig<D>): Promise<RequestResponse<R, D>> {
  return new Promise(async (resolve, reject) => {
    const headers = new Headers(config?.data instanceof FormData ? HEADERS_FORMDATA : HEADERS_JSON)

    const settings = getSettings()

    if (!settings.base.baseURL) {
      showErrorMessage(`Base URL is not set. Please, setup the extension in "${ SETTINGS_KEY_CAP }: Settings".`)
      return Promise.reject()
    }

    if (!config?.noAuth) {
      if (!settings.base.token) {
        showErrorMessage(`Token is not set. Please, setup the extension in "${ SETTINGS_KEY_CAP }: Settings".`)
        return Promise.reject()
      }

      headers.append('Authorization', 'Token ' + settings.base.token)
    }

    const params = config?.params ? '?' + getURLParams(config.params) : ''

    const urlValue = getPortalUrl() + BASE_URL + url + params

    outputChannel.appendLine(urlValue)

    const request = new Request(
      urlValue,
      {
        method: method,
        headers,
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: config?.data ? config.data instanceof FormData ? config.data : JSON.stringify(config.data) : undefined,
        signal: config?.signal,
      },
    )

    fetch(request)
      .then(response => {
        response
          .json()
          .catch(() => undefined)
          .then(data => {
            if (response.ok) {
              resolve({
                data: data as R,
                status: response.status,
                config: config,
                request: request as unknown as RequestResponse<R, D>['request'],
              })
            } else {
              reject(new ApiError<D>({
                data: data as ApiError<D>['response']['data'],
                status: response.status,
                config: config,
                request: request as unknown as RequestResponse<R, D>['request'],
              }))
            }
          })
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          reject(new ApiErrorCancel<D>({
            data: undefined,
            config: config,
            request: request as unknown as RequestResponse<R, D>['request'],
          }))
        }

        reject(error)
      })
  })
}

function doGet<R>(url: `/${ string }/`, config?: RequestConfig<never>) {
  return doFetch<R, NonNullable<unknown>>('GET', url, config)
}

function doPost<R, D extends RequestData = RequestData>(url: `/${ string }/`, data?: Required<RequestConfig<D>>['data'], config?: Omit<RequestConfig<D>, 'data'>) {
  return doFetch<R, D>('POST', url, {data, ...config})
}

function doPatch<R, D extends RequestData = RequestData>(url: `/${ string }/`, data?: Required<RequestConfig<D>>['data'], config?: Omit<RequestConfig<D>, 'data'>) {
  return doFetch<R, D>('PATCH', url, {data, ...config})
}

function doDelete<R>(url: `/${ string }/`, config?: RequestConfig<never>) {
  return doFetch<R, NonNullable<unknown>>('DELETE', url, config)
}

export const apiClient = {
  get: doGet,
  post: doPost,
  patch: doPatch,
  delete: doDelete,
}