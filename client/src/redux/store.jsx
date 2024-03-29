import {configureStore} from '@reduxjs/toolkit'
import authReducer from './authSlice'
import clientReducer from './clientSlice'
import reviewerReducer from './reviewerSlice'
import adminReducer from './adminSlice'

export const store = configureStore({
    reducer:{
        authReducer: authReducer,
        clientReducer:clientReducer,
        reviewerReducer:reviewerReducer,
        adminReducer:adminReducer,
    }
})

