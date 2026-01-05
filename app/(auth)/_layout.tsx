import { BurgerLogo } from "@/components/BurgerLogo";
import { images } from "@/constants";
import { router, Slot } from "expo-router";
import {
    Dimensions,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    View
} from 'react-native';

export default function AuthLayout() {
    return (
        <View className="flex-1 bg-bg-primary">
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView 
                    className="flex-1" 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    <View 
                        className="w-full relative overflow-hidden" 
                        style={{ height: Dimensions.get('screen').height / 2.5 }}
                    >
                        <ImageBackground 
                            source={images.loginGraphic} 
                            className="size-full" 
                            resizeMode="cover"
                        >
                            <View 
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '40%',
                                    backgroundColor: 'rgba(10, 10, 10, 0.7)',
                                }}
                            />
                        </ImageBackground>
                        <Pressable 
                            onPress={() => router.push("/")}
                            className="absolute bottom-0 left-0 right-0 items-center"
                            style={{ paddingBottom: 40 }}
                        >
                            <BurgerLogo size={128} />
                        </Pressable>
                    </View>
                    <View className="flex-1 -mt-8">
                        <Slot />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    )
}