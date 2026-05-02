import { useLocalSearchParams } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

const TransactionDetail = () => {
  const { id } = useLocalSearchParams()

  return (
    <View>
      <Text>Transaction ID: {id}</Text>
    </View>
  )
}

export default TransactionDetail