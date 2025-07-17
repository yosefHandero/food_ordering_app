import {Text, TouchableOpacity, Image, Platform, Alert} from 'react-native'
import {MenuItem} from "@/type";
import {appwriteConfig} from "@/lib/appwrite";
import {useCartStore} from "@/store/cart.store";
import useAuthStore from "@/store/auth.state";

import {router} from "expo-router";

const MenuCard = ({ item: { $id, image_url, name, price }}: { item: MenuItem}) => {
    const imageUrl = `${image_url}?project=${appwriteConfig.projectId}`;
    const { addItem } = useCartStore();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    // console.log("isAuthenticated", isAuthenticated);

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            Alert.alert(
                "Login Required",
                "Please log in to order items.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Login", onPress: () => router.push('/sign-in') }
                ]
            );
            return;
        }

        addItem({
            id: $id,
            name,
            price,
            image_url: imageUrl,
            customization: []
        });


    };

    return (
        <TouchableOpacity className="menu-card" style={Platform.OS === 'android' ? { elevation: 10, shadowColor: '#878787'}: {}}>
            <Image source={{ uri: imageUrl }} className="size-32 absolute -top-10" resizeMode="contain" />
            <Text className="text-center base-bold text-dark-100 mb-2" numberOfLines={1}>{name}</Text>
            <Text className="body-regular text-gray-200 mb-4">From ${price}</Text>
            <TouchableOpacity onPress={handleAddToCart}>
                <Text className="paragraph-bold text-primary">Add to Cart +</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    )
}
export default MenuCard