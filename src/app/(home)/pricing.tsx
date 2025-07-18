import { View, Platform } from "react-native"
import { PricingTable } from "@clerk/clerk-expo/web"

import { Text } from "@/components/Text"

export default function PricingPage() {
  return (
    <View>
      {Platform.OS === "web" ? <PricingTable /> : <Text>Mobile pricing coming soon.</Text>}
    </View>
  )
}
