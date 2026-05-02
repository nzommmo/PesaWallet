import { useLocalSearchParams } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

const UserDetail = () => {
  const { id } = useLocalSearchParams()

  return (
    <View>
      <Text>User ID: {id}</Text>
    </View>
  )
}

export default UserDetail