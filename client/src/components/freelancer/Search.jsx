// screens/Search.jsx - Full Screen Search with SafeAreaView

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getFreelancerJobs, getJobById } from '../../Redux/slices/jobSlice';

// ── Vantara Design tokens ──────────────────────────────────────────────────────────
const NAVY       = '#071A3E';
const BLUE       = '#0055A5';
const BLUE_MD    = '#0073CF';
const GOLD       = '#C89520';
const GOLD_DK    = '#8A6410';
const WHITE      = '#FFFFFF';
const BG         = '#EEF4FA';
const CARD       = '#FFFFFF';
const TEXT_MAIN  = '#071A3E';
const TEXT_MUTED = '#3A5070';
const TEXT_LIGHT = '#7A90A8';
const BORDER     = '#C8D8E8';
const SILVER2    = '#B8C8D8';
const GREEN      = '#059669';
// ─────────────────────────────────────────────────────────────────────────────────

// Format functions
const formatLocation = (location) => {
  if (!location) return null;
  if (typeof location === 'string') return location;
  const parts = [];
  if (location.address) parts.push(location.address);
  if (location.city) parts.push(location.city);
  if (location.province) parts.push(location.province);
  if (location.country && location.country !== 'Philippines') parts.push(location.country);
  if (location.zip_code) parts.push(location.zip_code);
  return parts.length > 0 ? parts.join(', ') : null;
};

const formatBudgetForCard = (job) => {
  if (job?.budget) {
    const min = job.budget.min || 0;
    const max = job.budget.max || min;
    const currency = job.budget.currency || 'PHP';
    if (min && max && min !== max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${currency} ${min.toLocaleString()}+`;
  }
  return null;
};

const getTimeAgo = (date) => {
  if (!date) return null;
  try {
    const now = new Date();
    const past = new Date(date);
    if (isNaN(past.getTime())) return null;
    const diffInSeconds = Math.floor((now - past) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
  } catch (error) {
    return null;
  }
};

export default function SearchScreen({ onNavigate, route }) {
  const dispatch = useDispatch();
  
  // Get jobs from Redux
  const jobsSlice = useSelector(s => s.jobs);
  const jobs = jobsSlice?.jobs?.list || [];
  const jobsLoading = jobsSlice?.jobs?.isLoading || false;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [popularSearches, setPopularSearches] = useState([]);
  const [categories, setCategories] = useState([
    { id: '1', name: 'IT & Software', icon: 'laptop-outline' },
    { id: '2', name: 'Design', icon: 'brush-outline' },
    { id: '3', name: 'Marketing', icon: 'megaphone-outline' },
    { id: '4', name: 'Writing', icon: 'create-outline' },
    { id: '5', name: 'Admin', icon: 'folder-outline' },
    { id: '6', name: 'Engineering', icon: 'construct-outline' },
  ]);

  // Load recent searches from route params
  useEffect(() => {
    if (route?.params?.recentSearches) {
      setRecentSearches(route.params.recentSearches);
    }
  }, [route?.params]);

  // Generate popular searches from job data
  useEffect(() => {
    if (jobs && jobs.length > 0) {
      generatePopularSearches(jobs);
    }
  }, [jobs]);

  // Generate popular searches from job data
  const generatePopularSearches = (jobsList) => {
    const categoriesMap = {};
    const skillsMap = {};
    const locationsMap = {};
    
    jobsList.forEach(job => {
      if (job.category) {
        categoriesMap[job.category] = (categoriesMap[job.category] || 0) + 1;
      }
      
      if (job.required_skills && Array.isArray(job.required_skills)) {
        job.required_skills.forEach(skill => {
          skillsMap[skill] = (skillsMap[skill] || 0) + 1;
        });
      }
      
      const location = formatLocation(job.location);
      if (location) {
        locationsMap[location] = (locationsMap[location] || 0) + 1;
      }
    });
    
    const popular = [];
    
    Object.entries(categoriesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([name, count]) => {
        popular.push({
          id: `cat-${name}`,
          title: name,
          count: count,
          location: 'All locations',
          type: 'category'
        });
      });
    
    Object.entries(skillsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([name, count]) => {
        popular.push({
          id: `skill-${name}`,
          title: name,
          count: count,
          location: 'All locations',
          type: 'skill'
        });
      });
    
    setPopularSearches(popular);
  };

  // Handle search input change
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    setShowResults(false);
    
    if (!text.trim()) {
      setSearchResults([]);
    }
  };

  // Handle search submission
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search', 'Please enter a search term');
      return;
    }

    setIsSearching(true);
    performSearch(searchQuery.trim());
  };

  // Perform search on jobs
  const performSearch = (query) => {
    setIsSearching(true);
    
    const filtered = jobs.filter(job => {
      const q = query.toLowerCase().trim();
      const title = job.title?.toLowerCase() || '';
      const description = job.description?.toLowerCase() || '';
      const skills = job.required_skills?.join(' ').toLowerCase() || '';
      const company = job.client_id?.company_name?.toLowerCase() || '';
      const business = job.client_id?.business_name?.toLowerCase() || '';
      const category = job.category?.toLowerCase() || '';
      const location = typeof job.location === 'string' 
        ? job.location.toLowerCase() 
        : formatLocation(job.location)?.toLowerCase() || '';
      
      return title.includes(q) || 
             description.includes(q) || 
             skills.includes(q) ||
             company.includes(q) ||
             business.includes(q) ||
             category.includes(q) ||
             location.includes(q);
    });
    
    setSearchResults(filtered);
    setShowResults(true);
    setIsSearching(false);
    
    addToRecentSearches(query);
  };

  // Add search to recent
  const addToRecentSearches = (query) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== query.toLowerCase());
      return [query, ...filtered].slice(0, 10);
    });
  };

  // Handle selecting a search term
  const handleSelectSearch = (query) => {
    setSearchQuery(query);
    addToRecentSearches(query);
    performSearch(query);
  };

  // Apply search and navigate back
  const applySearchAndGoBack = (query) => {
    if (onNavigate) {
      onNavigate('FreelancerDashboard', { 
        searchQuery: query,
        screen: 'Home',
        recentSearches: recentSearches
      });
    }
  };

  // Handle clearing a recent search
  const handleClearRecent = (index) => {
    setRecentSearches(prev => prev.filter((_, i) => i !== index));
  };

  // Handle clearing all recent searches
  const handleClearAllRecent = () => {
    Alert.alert(
      'Clear Recent Searches',
      'Are you sure you want to clear all recent searches?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => setRecentSearches([]) },
      ]
    );
  };

  // Handle applying a filter/category
  const handleApplyFilter = (filter) => {
    addToRecentSearches(filter);
    if (onNavigate) {
      onNavigate('FreelancerDashboard', { 
        searchQuery: filter,
        screen: 'Home',
        recentSearches: recentSearches
      });
    }
  };

  // Handle going back
  const handleGoBack = () => {
    if (searchQuery.trim() && showResults && searchResults.length > 0) {
      if (onNavigate) {
        onNavigate('FreelancerDashboard', { 
          searchQuery: searchQuery,
          screen: 'Home',
          recentSearches: recentSearches
        });
      }
    } else {
      if (onNavigate) {
        onNavigate('FreelancerDashboard', { 
          screen: 'Home',
          recentSearches: recentSearches
        });
      }
    }
  };

  // Render recent search item
  const renderRecentItem = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.recentItem}
      onPress={() => handleSelectSearch(item)}
      activeOpacity={0.7}
    >
      <View style={styles.recentLeft}>
        <View style={styles.recentIconWrap}>
          <Ionicons name="time-outline" size={16} color={BLUE} />
        </View>
        <Text style={styles.recentText} numberOfLines={1}>{item}</Text>
      </View>
      <TouchableOpacity 
        onPress={() => handleClearRecent(index)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close-circle" size={18} color={TEXT_LIGHT} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render popular search item
  const renderPopularItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.popularItem}
      onPress={() => handleSelectSearch(item.title)}
      activeOpacity={0.7}
    >
      <View style={styles.popularLeft}>
        <Ionicons name="search-outline" size={18} color={TEXT_LIGHT} />
        <Text style={styles.popularTitle} numberOfLines={1}>{item.title}</Text>
      </View>
      <View style={styles.popularRight}>
        <Text style={styles.popularCount}>{item.count} new</Text>
        {item.location && (
          <Text style={styles.popularLocation}>in {item.location}</Text>
        )}
        <Ionicons name="chevron-forward" size={16} color={TEXT_LIGHT} />
      </View>
    </TouchableOpacity>
  );

  // Render category item
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryItem}
      onPress={() => handleApplyFilter(item.name)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryIconWrap}>
        <Ionicons name={item.icon} size={20} color={BLUE} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Render search result item
  const renderResultItem = ({ item }) => {
    const locationDisplay = formatLocation(item.location) || 'Remote';
    const budgetDisplay = formatBudgetForCard(item);
    const timeAgo = getTimeAgo(item.createdAt);
    const client = item.client_id || {};
    
    const getClientName = () => {
      if (client.company_name) return client.company_name;
      if (client.business_name) return client.business_name;
      if (client.first_name && client.last_name) {
        return `${client.first_name} ${client.last_name}`;
      }
      if (client.name) return client.name;
      return 'Client';
    };

    return (
      <TouchableOpacity 
        style={styles.resultItem}
        onPress={() => handleApplyFilter(item.title)}
        activeOpacity={0.7}
      >
        <View style={styles.resultContent}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
            {item.urgent && (
              <View style={styles.resultBadgeUrgent}>
                <Text style={styles.resultBadgeText}>Urgent</Text>
              </View>
            )}
          </View>
          <Text style={styles.resultCompany}>{getClientName()}</Text>
          <View style={styles.resultMeta}>
            <Text style={styles.resultLocation}>{locationDisplay}</Text>
            {budgetDisplay && (
              <Text style={styles.resultBudget}>{budgetDisplay}</Text>
            )}
            {timeAgo && (
              <Text style={styles.resultTime}>{timeAgo}</Text>
            )}
          </View>
        </View>
        <Ionicons name="arrow-forward" size={16} color={BLUE} />
      </TouchableOpacity>
    );
  };

  // Render empty state
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color={SILVER2} />
      <Text style={styles.emptyTitle}>No results found</Text>
      <Text style={styles.emptyText}>
        Try adjusting your search or browse our categories below
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={TEXT_MAIN} />
          </TouchableOpacity>
          
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color={TEXT_LIGHT} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search jobs, skills, companies..."
              placeholderTextColor={TEXT_LIGHT}
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setShowResults(false);
                setSearchResults([]);
              }}>
                <Ionicons name="close-circle" size={20} color={TEXT_LIGHT} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Content ── */}
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : showResults ? (
          // ── Search Results ──
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </Text>
              <TouchableOpacity onPress={() => {
                setShowResults(false);
                setSearchResults([]);
              }}>
                <Text style={styles.clearResultsText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => item._id || index.toString()}
              renderItem={renderResultItem}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={EmptyState}
            />
          </View>
        ) : (
          // ── Recent Searches & Popular ──
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <TouchableOpacity onPress={handleClearAllRecent}>
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.map((item, index) => (
                  <View key={index}>
                    {renderRecentItem({ item, index })}
                  </View>
                ))}
              </View>
            )}

            {/* Popular Searches */}
            {popularSearches.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Searches</Text>
                <FlatList
                  data={popularSearches}
                  keyExtractor={(item) => item.id}
                  renderItem={renderPopularItem}
                  scrollEnabled={false}
                  contentContainerStyle={styles.popularList}
                />
              </View>
            )}

            {/* Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Browse Categories</Text>
              <View style={styles.categoryGrid}>
                {categories.map((item) => (
                  <View key={item.id} style={styles.categoryItemWrapper}>
                    {renderCategoryItem({ item })}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: BG 
  },
  root: { 
    flex: 1, 
    backgroundColor: BG 
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1.5,
    borderColor: BORDER,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: TEXT_MAIN,
    paddingVertical: 8,
  },

  // ── Content ──
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },

  // ── Sections ──
  section: {
    backgroundColor: WHITE,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  clearAllText: {
    fontSize: 13,
    color: BLUE,
    fontWeight: '500',
  },

  // ── Recent Items ──
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  recentIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: `${BLUE}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentText: {
    fontSize: 14,
    color: TEXT_MAIN,
    flex: 1,
  },

  // ── Popular Items ──
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  popularLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  popularTitle: {
    fontSize: 14,
    color: TEXT_MAIN,
    flex: 1,
  },
  popularRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  popularCount: {
    fontSize: 12,
    color: BLUE,
    fontWeight: '600',
  },
  popularLocation: {
    fontSize: 12,
    color: TEXT_LIGHT,
  },
  popularList: {
    paddingTop: 4,
  },

  // ── Categories ──
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  categoryItemWrapper: {
    width: '30%',
  },
  categoryItem: {
    backgroundColor: BG,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    gap: 4,
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${BLUE}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── Results ──
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  clearResultsText: {
    fontSize: 13,
    color: BLUE,
    fontWeight: '500',
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WHITE,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  resultContent: {
    flex: 1,
    marginRight: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_MAIN,
    flex: 1,
  },
  resultBadgeUrgent: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },
  resultCompany: {
    fontSize: 13,
    color: BLUE,
    fontWeight: '500',
    marginTop: 2,
  },
  resultMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  resultLocation: {
    fontSize: 12,
    color: TEXT_LIGHT,
  },
  resultBudget: {
    fontSize: 12,
    color: GOLD_DK,
    fontWeight: '600',
  },
  resultTime: {
    fontSize: 12,
    color: TEXT_LIGHT,
  },

  // ── Loading ──
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_MUTED,
  },

  // ── Empty State ──
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  bottomPadding: {
    height: 40,
  },
});