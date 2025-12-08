import CartButton from '@/components/CartButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { images } from '@/constants';
import useAuthStore from '@/store/auth.state';
import { User } from '@/type';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  Text,
  View
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnimatedView = Animated.createAnimatedComponent(View);

const Profile = () => {
  // Use selectors to only subscribe to needed state, preventing unnecessary re-renders
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const fetchAuthenticatedUser = useAuthStore((state) => state.fetchAuthenticatedUser);

  useEffect(() => {
    const init = async () => {
      if (!isAuthenticated) {
        const fetchedUser: User | null = await fetchAuthenticatedUser();

        if (!fetchedUser) {
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await useAuthStore.getState().signOut();
              router.replace('/');
            } catch (err) {
              Alert.alert('Logout Failed', 'Please try again later.');
            }
          },
        },
      ]
    );
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
                {user?.avatar ? (
                  <Image
                    source={{
                      uri: typeof user.avatar === 'string' ? user.avatar : user.avatar_url || 'https://i.pravatar.cc/100?img=12',
                    }}
                    className="w-20 h-20 rounded-full border-2 border-accent-primary"
                    onError={() => {
                      // Fallback handled by defaultSource or placeholder
                    }}
                  />
                ) : (
                  <View className="w-20 h-20 rounded-full border-2 border-accent-primary bg-bg-elevated items-center justify-center">
                    <Ionicons name="person-outline" size={32} color="#FF6B35" />
                  </View>
                )}
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
