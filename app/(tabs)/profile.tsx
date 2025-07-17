import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    Dimensions,
    ImageBackground,
    Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import useAuthStore from '@/store/auth.state'
import CartButton from '@/components/CartButton';
import {account} from "@/lib/appwrite";
import {router} from "expo-router";
import {images} from "@/constants";
import {useEffect} from "react";
import {User} from "@/type";

const Profile = () => {
    const { user, setUser, setIsAuthenticated, fetchAuthenticatedUser } = useAuthStore();

    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    useEffect(() => {
        const init = async () => {
            if (!isAuthenticated) {
                const user: User | null = await fetchAuthenticatedUser();

                if (!user) {
                    setIsAuthenticated(false);
                    setUser(null);
                }
            }
        };

        init();
    }, []);




    const handleLogout = async () => {
        try {
            await account.deleteSession('current');
            setUser(null);
            setIsAuthenticated(false);
        } catch (err) {
            Alert.alert('Logout Failed', 'Please try again later.');
        }
    };

    return (
        <SafeAreaView className="h-full">
            <ScrollView contentContainerClassName="px-5 pb-32" className="bg-white h-full" keyboardShouldPersistTaps="handled">
                {/* Header */}
                <View className="w-full relative" style={{ height: Dimensions.get('screen').height / 2.25}}>
                    <ImageBackground source={images.loginGraphic} className="size-full rounded-b-lg" resizeMode="stretch" />
                    <Pressable onPress={() => router.push("/")}><Image source={images.logo} className="self-center size-48 absolute -bottom-16 z-10" /></Pressable>

                </View>
                <View className="flex-row justify-between items-center my-5">
                    <TouchableOpacity onPress={() => router.push("/")}>
                        <Image
                            source={images.arrowBack}
                            className="size-5"
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                    <CartButton />
                </View>

                <View className="bg-primary/90 rounded-2xl p-5 flex-row items-center gap-x-5">
                    <Image
                        source={{ uri: typeof user?.avatar === 'string' ? user.avatar : 'https://i.pravatar.cc/100?img=12' }}
                        className="w-16 h-16 rounded-full"
                    />

                    <View>
                        <Text className="text-white text-lg font-semibold">{user?.name || 'Guest User'}</Text>
                        <Text className="text-white/80 text-sm">{user?.email || 'No Email'}</Text>
                    </View>
                </View>

                {isAuthenticated ? (
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="bg-red-100 mt-10 rounded-xl py-3 flex-row justify-center items-center"
                    >
                        <MaterialIcons name="logout" size={20} color="#d32f2f" />
                        <Text className="ml-2 text-red-700 font-semibold">Logout</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={() => router.push('/sign-in')}
                        className="bg-primary mt-10 rounded-xl py-3 flex-row justify-center items-center"
                    >
                        <Feather name="log-in" size={20} color="#fff" />
                        <Text className="ml-2 text-white font-semibold">Login</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;
