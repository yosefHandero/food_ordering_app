import {SafeAreaView} from "react-native-safe-area-context";
import { FlatList, Image, Pressable, Text, TouchableOpacity, View} from "react-native";
import {Fragment, useState} from "react";
import cn from 'clsx';

import CartButton from "@/components/CartButton";
import {images, offers} from "@/constants";
import {router} from "expo-router";
import useAuthStore from "@/store/auth.state";



export default function Index() {


    const { user } = useAuthStore();
    const handlePress = (index: number) => {
        const categoryMap = [
            '686d9c28003d73b1c74a', // Sandwiches
            '686d9c270012c9b070ef', // Burgers
            '686d9c280013d6219054', // Pizzas
            '686d9c2800352e8da868'  // Burritos
        ];

        const selectedCategoryId = categoryMap[index];
        if (selectedCategoryId) {
            router.push(`/search?category=${selectedCategoryId}`);
        } else {
            router.push('/search');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <FlatList
                data={offers}

                renderItem={({ item, index }) => {
                    const isEven = index % 2 === 0;

                    return (
                        <View>
                            <Pressable
                                className={cn("offer-card", isEven ? 'flex-row-reverse' : 'flex-row')}
                                style={{ backgroundColor: item.color }}
                                android_ripple={{ color: "#fffff22"}}
                                onPress={() => handlePress(index)}

                            >
                                {({ pressed }) => (
                                    <Fragment>
                                        <View className={"h-full w-1/2"}>
                                            <Image source={item.image} className={"size-full"} resizeMode={"contain"} />
                                        </View>

                                        <View className={cn("offer-card__info", isEven ? 'pl-10': 'pr-10')}>
                                            <Text className="h1-bold text-white leading-tight">
                                                {item.title}
                                            </Text>
                                            <Image
                                                source={images.arrowRight}
                                                className="size-10"
                                                resizeMode="contain"
                                                tintColor="#ffffff"
                                            />
                                        </View>
                                    </Fragment>
                                )}
                            </Pressable>
                        </View>
                    )
                }}
                contentContainerClassName="pb-28 px-5"
                ListHeaderComponent={() => (
                    <View className="flex-between flex-row w-full my-5">
                        <View className="flex-start">
                            <TouchableOpacity className="flex-center flex-row gap-x-1 mt-0.5">
                                <Image source={images.logo} className="size-7" resizeMode="contain" />
                            </TouchableOpacity>
                            <Text className="xl:border-l-dark-100 text-primary">MealHop</Text>
                        </View>

                        <CartButton />
                    </View>
                )}
            />
        </SafeAreaView>
    );
}