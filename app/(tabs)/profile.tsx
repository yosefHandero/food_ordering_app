import {
  View,
  Text,
  Image,
  ScrollView,
  Alert,
  Dimensions,
  ImageBackground,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '@/store/auth.state';
import CartButton from '@/components/CartButton';
import { signOut } from '@/lib/supabase-auth';
import { router } from 'expo-router';
import { images } from '@/constants';
import { useEffect } from 'react';
import { User } from '@/type';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Animated, { FadeIn } from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);

const Profile = () => {
  const { user, setUser, setIsAuthenticated, fetchAuthenticatedUser } =
    useAuthStore();

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
      await useAuthStore.getState().signOut();
    } catch (err) {
      Alert.alert('Logout Failed', 'Please try again later.');
    }
  };

  return (
    <SafeAreaView className="h-full bg-bg-primary" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Banner */}
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
                height: '60%',
                backgroundColor: 'rgba(0,0,0,0.6)',
              }}
            />
          </ImageBackground>
          <View
            className="absolute bottom-0 left-0 right-0 items-center"
            style={{ paddingBottom: 40 }}
          >
            <Image
              source={images.logo}
              className="size-32"
              resizeMode="contain"
            />
          </View>
          <View className="absolute top-0 left-0 right-0 flex-row items-center justify-between p-5">
            <Button
              title=""
              onPress={() => router.push('/')}
              variant="ghost"
              leftIcon="arrow-back"
              size="sm"
            />
            <CartButton />
          </View>
        </View>

        <View className="px-5 -mt-16 pb-8">
          {/* User Card */}
          <AnimatedView entering={FadeIn.delay(200)}>
            <Card variant="elevated" className="mb-6">
              <View className="flex-row items-center gap-4">
                <Image
                  source={{
                    uri:
                      typeof user?.avatar === 'string'
                        ? user.avatar
                        : 'https://i.pravatar.cc/100?img=12',
                  }}
                  className="w-20 h-20 rounded-full border-2 border-accent-primary"
                />
                <View className="flex-1">
                  <Text className="h3-bold text-text-primary mb-1">
                    {user?.name || 'Guest User'}
                  </Text>
                  <Text className="paragraph-medium text-text-tertiary">
                    {user?.email || 'No Email'}
                  </Text>
                </View>
              </View>
            </Card>
          </AnimatedView>

          {/* Action Buttons */}
          {isAuthenticated ? (
            <AnimatedView entering={FadeIn.delay(300)}>
              <Button
                title="Logout"
                onPress={handleLogout}
                variant="secondary"
                fullWidth
                leftIcon="log-out-outline"
              />
            </AnimatedView>
          ) : (
            <AnimatedView entering={FadeIn.delay(300)}>
              <Button
                title="Sign In"
                onPress={() => router.push('/sign-in')}
                variant="primary"
                fullWidth
                leftIcon="log-in-outline"
              />
            </AnimatedView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
