import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
    ImageBackground,
    Image,
    Pressable
} from 'react-native'
import {Redirect, router, Slot} from "expo-router";
import {images} from "@/constants";
import useAuthStore from "@/store/auth.state";
import { usePathname } from "expo-router";


export default function AuthLayout() {

    const pathname = usePathname();

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView className="bg-white h-full" keyboardShouldPersistTaps="handled">
                <View className="w-full relative" style={{ height: Dimensions.get('screen').height / 2.25}}>
                    <ImageBackground source={images.loginGraphic} className="size-full rounded-b-lg" resizeMode="stretch" />
                  <Pressable onPress={() => router.push("/")}><Image source={images.logo} className="self-center size-48 absolute -bottom-16 z-10" /></Pressable>

                </View>
                <Slot />
            </ScrollView>
        </KeyboardAvoidingView>
    )
}