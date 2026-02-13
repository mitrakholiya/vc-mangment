import { CircularProgress } from '@mui/material'
import React from 'react'

const Loading = () => {
  return (
    <div className='flex justify-center items-center h-48 flex-1'>
        <CircularProgress />
    </div>
  )
}

export default Loading