import React from 'react';
import { StyleSheet, View, ScrollView, Image, TouchableOpacity, ActivityIndicator, TextInput, Animated, Dimensions, StatusBar, Platform, Modal, Alert, Easing, FlatList } from 'react-native';
import { ThemedText } from '@cmp/ThemedText';
import { ThemedView } from '@cmp/ThemedView';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { menuService } from '@lib/services/menuService';
import { MenuItem } from '@lib/types/menu';
import LottieView from '@cmp/LottieFallback';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GUTTER = 12;
const CARD_WIDTH = (width - GRID_PADDING * 2 - GRID_GUTTER) / 2;

export default function SearchScreen() {
  const { q } = useLocalSearchParams();
  const [results, setResults] = useState<MenuItem[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState((q || '').toString());
  const [inputValue, setInputValue] = useState((q || '').toString());
  const [searchFocused, setSearchFocused] = useState(false);
  const [popularSearches] = useState(['Chicken Biryani', 'Pizza', 'Burger', 'Coffee', 'Snacks', 'Drinks', 'Pasta', 'Salad']);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{ name: string; image?: string }[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  
  // Enhanced Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef(results.map(() => new Animated.Value(0))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  // Shared scroll value to drive item animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const inputDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);
  const nameIndex = useRef<{ original: string; lower: string; image?: string }[]>([]);

  const categories = [
    { id: '', name: 'All', icon: 'grid-outline', color: '#4CAF50' },
    { id: 'Main Course', name: 'Main Course', icon: 'restaurant-outline', color: '#FF6B6B' },
    { id: 'Appetizer', name: 'Appetizer', icon: 'wine-outline', color: '#4ECDC4' },
    { id: 'Fast Food', name: 'Fast Food', icon: 'fast-food-outline', color: '#45B7D1' },
    { id: 'Bread', name: 'Bread', icon: 'pizza-outline', color: '#96CEB4' },
    { id: 'Dessert', name: 'Dessert', icon: 'ice-cream-outline', color: '#FFEAA7' }
  ];

  const sortOptions = [
    { id: 'relevance', name: 'Relevance', icon: 'trending-up' },
    { id: 'price-low', name: 'Price: Low to High', icon: 'arrow-up' },
    { id: 'price-high', name: 'Price: High to Low', icon: 'arrow-down' },
    { id: 'rating', name: 'Rating', icon: 'star' },
    { id: 'name', name: 'Name A-Z', icon: 'text' }
  ];

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        setIsAuthenticated(!!token);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuthStatus();
    setLoading(true);
    menuService.getAllMenuItems().then((items) => {
      setAllItems(items);
      nameIndex.current = items.map((it) => ({ original: it.name, lower: it.name.toLowerCase(), image: it.image }));
      setLoading(false);
    });
  }, []);

  // Refresh auth status whenever the screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      const refreshAuth = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (!cancelled) setIsAuthenticated(!!token);
        } catch {
          if (!cancelled) setIsAuthenticated(false);
        }
      };
      refreshAuth();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    let filtered = allItems.filter(item =>
      item.name.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    setResults(filtered);

    if (!query) {
      setSuggestions([]);
    } else {
      const out: { name: string; image?: string }[] = [];
      for (let i = 0; i < nameIndex.current.length && out.length < 6; i++) {
        const n = nameIndex.current[i];
        if (n.lower.includes(query)) {
          if (!out.find(s => s.name === n.original)) out.push({ name: n.original, image: n.image });
        }
      }
      setSuggestions(out);
    }
  }, [allItems, searchQuery, selectedCategory, sortBy]);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Start shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Keep cart count in sync when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      let interval: any;
      const fetchCartCount = async () => {
        try {
          const cartData = await AsyncStorage.getItem('cart');
          const cartItems = cartData ? JSON.parse(cartData) : [];
          const total = (cartItems as { quantity?: number }[]).reduce((sum: number, i: { quantity?: number }) => sum + (i.quantity || 1), 0);
          setCartCount(total);
        } catch {
          setCartCount(0);
        }
      };
      fetchCartCount();
      interval = setInterval(fetchCartCount, 2000);
      return () => interval && clearInterval(interval);
    }, [])
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowSuggestions(query.length > 0);
    if (query.trim()) {
      setRecentSearches(prev => {
        const newSearches = [query, ...prev.filter(s => s !== query)].slice(0, 5);
        return newSearches;
      });
    }
  };

  const handleAddToCart = async (item: MenuItem) => {
    try {
      // Fetch latest token at action time to avoid stale local state
      const liveToken = await AsyncStorage.getItem('token');
      if (!liveToken) {
        Alert.alert(
          'Authentication Required',
          'Please log in to add items to cart.',
          [
            { text: 'Go to Login', onPress: () => router.push('/(tabs)/profile') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }
      const cartData = await AsyncStorage.getItem('cart');
      let cartItems: any[] = cartData ? JSON.parse(cartData) : [];
      const existingIndex = cartItems.findIndex((i: any) => i.id === item._id);
      if (existingIndex !== -1) {
        cartItems[existingIndex].quantity += 1;
      } else {
        cartItems.push({
          id: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          imageUrl: item.image,
          vendorId: (item as any).vendorId,
        });
      }
      await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
      Alert.alert('Added to Cart', `${item.name} has been added to your cart.`);
    } catch {
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
    Animated.spring(searchAnim, {
      toValue: categoryId ? 1 : 0,
      useNativeDriver: true,
    }).start();
  };

  const handleSortPress = (sortId: string) => {
    setSortBy(sortId);
    setShowFilters(false);
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
    setShowSuggestions(searchQuery.length > 0);
  };

  const handleSearchBlur = () => {
    setSearchFocused(false);
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // (Keep hooks above any early returns)

  // Precompute suggestion list for JSX rendering
  const computedSuggestions: { name: string; image?: string }[] = useMemo(() => (
    searchQuery 
      ? suggestions 
      : (recentSearches.slice(0, 5).map(n => ({ name: n as string })) as { name: string; image?: string }[])
  ), [searchQuery, suggestions, recentSearches]);

  const renderResultItem = useCallback(({ item, index }: { item: MenuItem; index: number }) => {
    const ITEM_SIZE = 220;
    const start = index * ITEM_SIZE;
    const inputRange = [start - ITEM_SIZE * 2, start, start + ITEM_SIZE * 2];
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.995, 1, 0.995],
      extrapolate: 'clamp',
    });
    return (
      <Animated.View
        style={[
          styles.gridCard,
          {
            transform: [
              { translateY: (cardAnimations[index] || slideAnim).interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
              { scale },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.gridCardContent}
          onPress={() => router.push({ pathname: '/item/[id]', params: { id: (item as any)._id } })}
          activeOpacity={0.9}
        >
          <View style={styles.gridImageContainer}>
            <Image
              source={{ uri: item.image || 'https://via.placeholder.com/300' }}
              style={styles.gridImage}
            />
            <View style={styles.gridOverlay}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <ThemedText style={styles.ratingText}>{item.rating?.toFixed(1) || '4.0'}</ThemedText>
              </View>
              <View style={styles.gridTopRight}>
                <View style={styles.categoryBadge} pointerEvents="none">
                  <ThemedText style={styles.categoryBadgeText} numberOfLines={1}>{item.category}</ThemedText>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.gridInfo}>
            <ThemedText style={styles.gridName} numberOfLines={2}>{item.name}</ThemedText>
            <View style={styles.gridFooter}>
              <View style={styles.pricePill}>
                <ThemedText style={styles.pricePillText}>₹{item.price}</ThemedText>
              </View>
              <TouchableOpacity style={styles.addFab} onPress={() => handleAddToCart(item)} activeOpacity={0.9}>
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [slideAnim, cardAnimations, scrollY]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
        <View style={[styles.loadingGradient, { backgroundColor: '#ffffff' }]}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header moved into list header to make it scrollable with content */}

      {/* Category chips moved into list header so they scroll with products */}

      {/* Search Suggestions Overlay */}
      {showSuggestions && (suggestions.length > 0 || (recentSearches.length > 0 && !searchQuery)) && (
        <Animated.View style={styles.suggestionsOverlay}>
          <BlurView intensity={20} tint="light" style={styles.suggestionsBlur}>
            <View style={styles.suggestionsContainer}>
              <View style={styles.suggestionsHeader}>
                <Ionicons name="search" size={16} color="#4CAF50" />
                <ThemedText style={styles.suggestionsTitle}>Search Suggestions</ThemedText>
              </View>
              {computedSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleSearch(suggestion.name)}
                    activeOpacity={0.7}
                  >
                    {suggestion.image ? (
                      <Image source={{ uri: suggestion.image }} style={styles.suggestionImage} />
                    ) : (
                      <Ionicons name="search-outline" size={16} color="#9CA3AF" />
                    )}
                    <ThemedText style={styles.suggestionText}>{suggestion.name}</ThemedText>
                    <Ionicons name="arrow-up" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Enhanced Results Section */}
      <Animated.View 
        style={[
          styles.resultsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {!searchQuery && results.length === 0 ? (
          // Enhanced Empty State
          <View style={styles.emptyState}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <LottieView
                source={require('../assets/animations/location.json')}
                autoPlay
                loop
                style={styles.emptyAnimation}
              />
            </Animated.View>
            <ThemedText style={styles.emptyTitle}>Ready to Explore?</ThemedText>
            <ThemedText style={styles.emptySubtitle}>Tap. Grab. Go</ThemedText>
            
            {/* Enhanced Popular Searches */}
            <View style={styles.popularContainer}>
              <View style={styles.popularHeader}>
                <Ionicons name="trending-up" size={20} color="#4CAF50" />
                <ThemedText style={styles.popularTitle}>Trending Now</ThemedText>
              </View>
              <View style={styles.popularTags}>
                {popularSearches.map((search, index) => (
                  <Animated.View
                    key={index}
                    style={{
                      opacity: fadeAnim,
                      transform: [{
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30 + (index * 10), 0]
                        })
                      }]
                    }}
                  >
                    <TouchableOpacity
                      style={styles.popularTag}
                      onPress={() => handleSearch(search)}
                      activeOpacity={0.8}
                    >
                      <ThemedText style={styles.popularTagText}>{search}</ThemedText>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </View>

            {/* Enhanced Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.recentContainer}>
                <View style={styles.recentHeader}>
                  <Ionicons name="time" size={20} color="#4CAF50" />
                  <ThemedText style={styles.recentTitle}>Recent Searches</ThemedText>
                </View>
                {recentSearches.map((search, index) => (
                  <Animated.View
                    key={index}
                    style={{
                      opacity: fadeAnim,
                      transform: [{
                        translateX: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50 + (index * 20), 0]
                        })
                      }]
                    }}
                  >
                    <TouchableOpacity
                      style={styles.recentItem}
                      onPress={() => handleSearch(search)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.recentIconContainer}>
                        <Ionicons name="time-outline" size={16} color="#4CAF50" />
                      </View>
                      <ThemedText style={styles.recentText}>{search}</ThemedText>
                      <Ionicons name="arrow-up" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        ) : results.length === 0 ? (
          // Enhanced No Results
          <View style={styles.noResultsContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <LottieView
                source={require('../assets/animations/animation1.json')}
                autoPlay
                loop
                style={styles.noResultsAnimation}
              />
            </Animated.View>
            <ThemedText style={styles.noResultsTitle}>Oops! No Results Found</ThemedText>
            <ThemedText style={styles.noResultsSubtitle}>
              Try searching with different keywords or browse categories
            </ThemedText>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => setSearchQuery('')}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          // Enhanced Results List (virtualized)
          <Animated.FlatList
            data={results}
            keyExtractor={(item: any) => item._id}
            renderItem={renderResultItem}
            contentContainerStyle={[styles.resultsContent, { paddingHorizontal: GRID_PADDING }]}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            key={'grid-2'}
            ListHeaderComponentStyle={{ marginHorizontal: -GRID_PADDING }}
            initialNumToRender={10}
            windowSize={9}
            maxToRenderPerBatch={12}
            updateCellsBatchingPeriod={40}
            removeClippedSubviews={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            ListHeaderComponent={
              <View>
                {/* Scrollable Header (unchanged UI) */}
                <Animated.View 
                  style={[
                    styles.header,
                    {
                      opacity: headerAnim,
                      transform: [{ translateY: headerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, 0]
                      })}]
                    }
                  ]}
                >
                  <View style={[styles.headerGradient, { backgroundColor: '#4CAF50' }]}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 16,
                      paddingTop: Platform.OS === 'ios' ? 8 : 0,
                      paddingBottom: 8,
                    }}>
                      <View>
                        <ThemedText style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>Search</ThemedText>
                        <ThemedText style={{ color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 4, letterSpacing: 0.5 }}>Tap · Grab · Go</ThemedText>
                      </View>
                      <TouchableOpacity
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => router.push('/cart')}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="cart-outline" size={22} color="#fff" />
                        {cartCount > 0 && (
                          <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#FF5252', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                            <ThemedText style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{cartCount}</ThemedText>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                    <View style={styles.headerContent}>
                      <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => router.back()}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                      </TouchableOpacity>
                      
                      <Animated.View style={[styles.searchContainer, { transform: [{ scale: headerAnim.interpolate({ inputRange: [0,1], outputRange: [0.95, 1] }) }]} ]}>
                        <View style={styles.searchIconContainer}>
                          <Ionicons name="search" size={20} color="#4CAF50" />
                        </View>
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Search for delicious food..."
                          placeholderTextColor="#9CA3AF"
                          value={inputValue}
                          onChangeText={(text) => {
                            setInputValue(text);
                            setShowSuggestions(text.length > 0);
                            const ql = text.toLowerCase();
                            if (!ql) {
                              setSuggestions([]);
                            } else {
                              const out: { name: string; image?: string }[] = [];
                              for (let i = 0; i < nameIndex.current.length && out.length < 6; i++) {
                                const n = nameIndex.current[i];
                                if (n.lower.includes(ql)) {
                                  if (!out.find(s => s.name === n.original)) out.push({ name: n.original, image: n.image });
                                }
                              }
                              setSuggestions(out);
                            }
                            if (inputDebounceRef.current) clearTimeout(inputDebounceRef.current);
                            inputDebounceRef.current = setTimeout(() => {
                              handleSearch(text);
                            }, 120);
                          }}
                          onFocus={handleSearchFocus}
                          onBlur={handleSearchBlur}
                          returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                          <TouchableOpacity 
                            onPress={() => handleSearch('')}
                            style={styles.clearButton}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                          </TouchableOpacity>
                        )}
                      </Animated.View>

                      <TouchableOpacity 
                        style={styles.filterButton}
                        onPress={() => setShowFilters(!showFilters)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="options-outline" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
                {/* Category chips that scroll with list */}
                <Animated.View 
                  style={[
                    styles.categoryContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }]
                    }
                  ]}
                >
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScrollView}
                    contentContainerStyle={styles.categoryScroll}
                  >
                    {categories.map((category, index) => (
                      <Animated.View
                        key={category.id}
                        style={{
                          opacity: fadeAnim,
                          transform: [{
                            translateX: slideAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [50 + (index * 30), 0]
                            })
                          }]
                        }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.categoryChip,
                            selectedCategory === category.id && styles.categoryChipActive,
                            { borderColor: category.color }
                          ]}
                          onPress={() => handleCategoryPress(category.id)}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' }]}>
                            <Ionicons 
                              name={category.icon as any} 
                              size={18} 
                              color={selectedCategory === category.id ? '#fff' : category.color} 
                            />
                          </View>
                          <ThemedText style={[
                            styles.categoryText,
                            selectedCategory === category.id && styles.categoryTextActive
                          ]}>
                            {category.name}
                          </ThemedText>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </ScrollView>
                </Animated.View>

                {/* Results header */}
                <View style={styles.resultsHeader}>
                  <View style={styles.resultsCountContainer}>
                    <Ionicons name="list" size={16} color="#4CAF50" />
                    <ThemedText style={styles.resultsCount}>
                      {results.length} {results.length === 1 ? 'item' : 'items'} found
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.sortButton}
                    onPress={() => setShowFilters(!showFilters)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="swap-vertical-outline" size={16} color="#4CAF50" />
                    <ThemedText style={styles.sortText}>Sort</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            }
          />
      )}
      </Animated.View>

      {/* Enhanced Filter Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <BlurView intensity={20} tint="light" style={styles.filterModal}>
          <View style={styles.filterContent}>
            <View style={styles.filterHeader}>
              <View style={styles.filterTitleContainer}>
                <Ionicons name="options" size={24} color="#4CAF50" />
                <ThemedText style={styles.filterTitle}>Sort & Filter</ThemedText>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowFilters(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterSection}>
              <ThemedText style={styles.filterSectionTitle}>Sort By</ThemedText>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.filterOption,
                    sortBy === option.id && styles.filterOptionActive
                  ]}
                  onPress={() => handleSortPress(option.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.filterOptionContent}>
                    <View style={styles.filterOptionIcon}>
                      <Ionicons 
                        name={option.icon as any} 
                        size={20} 
                        color={sortBy === option.id ? '#4CAF50' : '#666'} 
                      />
                    </View>
                    <ThemedText style={[
                      styles.filterOptionText,
                      sortBy === option.id && styles.filterOptionTextActive
                    ]}>
                      {option.name}
                    </ThemedText>
                  </View>
                  {sortBy === option.id && (
                    <View style={styles.checkmarkContainer}>
                      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
    </View>
        </BlurView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Enhanced Loading Styles
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },

  // Enhanced Header Styles
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : 8,
    paddingBottom: 12,
    backgroundColor: '#4CAF50',
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  searchIconContainer: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Enhanced Category Styles
  categoryContainer: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 0,
    backgroundColor: '#fff',
  },
  categoryScroll: {
    paddingLeft: 0,
    paddingRight: 16,
  },
  categoryScrollView: {
    marginLeft: 0,
    paddingLeft: 0,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#fff',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipActive: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#2e7d32',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#eee',
  },

  // Enhanced Suggestions Overlay
  suggestionsOverlay: {
    position: 'absolute',
    top: 140,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  suggestionsBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  suggestionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionsTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  suggestionImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  suggestionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },

  // Enhanced Results Styles
  resultsContainer: {
    flex: 1,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingTop: 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  resultsCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultsCount: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sortText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },

  // Enhanced Result Card Styles
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: GRID_GUTTER,
  },
  gridCard: {
    width: CARD_WIDTH,
    marginBottom: GRID_GUTTER,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eef0f2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  gridCardContent: {
    flex: 1,
  },
  gridImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f2f4f7',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    justifyContent: 'space-between',
  },
  gridTopRight: {
    alignSelf: 'flex-end',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-end',
    maxWidth: 90,
  },
  categoryBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  gridInfo: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#262626',
    lineHeight: 18,
    minHeight: 36,
  },
  gridFooter: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pricePill: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cfead0',
  },
  pricePillText: {
    color: '#2e7d32',
    fontWeight: '800',
    fontSize: 12,
  },
  addFab: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },

  // Enhanced Empty State Styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyAnimation: {
    width: 200,
    height: 200,
  },
  emptyTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#222',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 18,
    color: '#111',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  popularContainer: {
    width: '100%',
    marginBottom: 30,
  },
  popularHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
  },
  popularTitle: {
    marginLeft: 8,
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  popularTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  popularTag: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  popularTagText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  recentContainer: {
    width: '100%',
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
  },
  recentTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  recentIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  // Enhanced No Results Styles
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noResultsAnimation: {
    width: 150,
    height: 150,
  },
  noResultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },

  // Enhanced Filter Modal Styles
  filterModal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  filterContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: height * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTitle: {
    marginLeft: 12,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterOptionActive: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  checkmarkContainer: {
    marginLeft: 12,
  },
}); 