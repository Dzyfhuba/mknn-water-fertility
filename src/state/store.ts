import DataRaw from '@/types/data-raw'
import supabase from '@/variables/supabase'
import SweetAlertOption from '@/variables/sweetalert2'
import kFoldCrossValidation, { KFoldCrossValidationReturnType } from '@/variables/validation'
import { Action, Thunk, action, createStore, thunk } from 'easy-peasy'
import Swal from 'sweetalert2'

export interface GlobalState {
  // data: typeof DataRaw.Select[]
  data: DataRaw.Select[]
  setData: Action<GlobalState, DataRaw.Select[]>
  getData: Thunk<GlobalState>
  updateData: Thunk<GlobalState, {data: DataRaw.Select, id: number}>
  deleteData: Thunk<GlobalState, {ids: number[]}>

  dataPartial: DataRaw.Select[][]
  setDataPartial: Action<GlobalState, DataRaw.Select[][]>
  separateData: Thunk<GlobalState>

  isLoading: boolean
  setLoading: Action<GlobalState, boolean>

  kFoldCrossValidation: KFoldCrossValidationReturnType
  setKFoldCrossValidation: Action<GlobalState, KFoldCrossValidationReturnType>
}

const store = createStore<GlobalState>({
  data: [],
  setData: action((state, payload) => {
    state.data = payload
  }),
  getData: thunk(async (actions) => {
    actions.setLoading(true)
    const { data, error } = await supabase.from('data_raw').select('*').order('id', { ascending: true })
    if (!error) {
      actions.setData(data)
    } else {
      
      Swal.fire({
        ...SweetAlertOption.error,
        text: error.message
      })
    }
    actions.setLoading(false)
    console.log(data)
    return data
  }),
  updateData: thunk(async (actions, payload) => {
    const { data, error } = await supabase
      .from('data_raw')
      .update(payload.data)
      .eq('id', payload.id)
      .select('*')

    if (!error) {
      actions.getData()
      Swal.fire({
        ...SweetAlertOption.success,
        text: 'Data berhasil diupdate'
      })
    }
  }),
  deleteData: thunk(async (actions, payload) => {
    const { data, error } = await supabase
      .from('data_raw')
      .delete()
      .in('id', payload.ids)
      .select('*')

    if (!error) {
      actions.getData()
      Swal.fire({
        ...SweetAlertOption.success,
        text: 'Data berhasil dihapus'
      })
    }
  }),


  dataPartial: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('dataPartial') || '[]') : [],
  setDataPartial: action((state, payload) => {
    state.dataPartial = payload
  }),
  separateData: thunk((actions) => {
    const result = kFoldCrossValidation(store.getState().data)
    actions.setDataPartial(result.dataParts)

    console.log(result)

    actions.setKFoldCrossValidation(result)

    // store to local storage
    localStorage.setItem('dataPartial', JSON.stringify(result.dataParts))
  }),

  kFoldCrossValidation: { dataParts: [], modelScore: 0 },
  setKFoldCrossValidation: action((state, payload) => {
    state.kFoldCrossValidation = payload
  }),

  isLoading: false,
  setLoading: action((state, payload) => {
    state.isLoading = payload
  })
})

export default store