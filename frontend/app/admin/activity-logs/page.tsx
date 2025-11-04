'use client';

import React, { useEffect, useState, Fragment } from 'react';
import axios from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/Pagination';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';

interface Activity {
  id: number;
  log_name: string;
  description: string;
  subject_type: string;
  subject_id: number;
  causer_type: string;
  causer_id: number;
  causer: {
    first_name: string;
    last_name: string;
  };
  created_at: string;
  properties: {
    attributes?: Record<string, any>;
    old?: Record<string, any>;
  } | null;
}

interface PaginatedResponse {
  data: Activity[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

const ActivityLogsPage = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResponse, 'data'>>({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 20,
    next_page_url: null,
    prev_page_url: null,
  });
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const fetchActivities = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get<PaginatedResponse>(`/api/admin/activity-logs?page=${page}`);
      setActivities(response.data.data);
      const { data, ...rest } = response.data;
      setPagination(rest);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.last_page) {
      fetchActivities(page);
    }
  };

  const handleRowToggle = (activityId: number) => {
    setExpandedRow(expandedRow === activityId ? null : activityId);
  };

  const renderChanges = (activity: Activity) => {
    if (!activity.properties || (!activity.properties.attributes && !activity.properties.old)) {
      return 'N/A';
    }
    const { attributes, old } = activity.properties;

    if (attributes && old) {
      const changedKeys = Object.keys(attributes).filter(key => JSON.stringify(attributes[key]) !== JSON.stringify(old[key]));
      if (changedKeys.length === 0) return 'No changes';
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {changedKeys.map(key => (
            <div key={key} className="bg-gray-100 p-2 rounded">
              <span className="font-semibold">{key}: </span>
              <span className="line-through text-gray-500">{JSON.stringify(old[key])}</span>
              <span className="text-green-600"> → {JSON.stringify(attributes[key])}</span>
            </div>
          ))}
        </div>
      );
    }
    if (attributes) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {Object.keys(attributes).map(key => (
            <div key={key} className="bg-gray-100 p-2 rounded">
              <span className="font-semibold">{key}: </span>
              <span className="text-green-600">{JSON.stringify(attributes[key])}</span>
            </div>
          ))}
        </div>
      );
    }
    if (old) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {Object.keys(old).map(key => (
            <div key={key} className="bg-gray-100 p-2 rounded">
              <span className="font-semibold">{key}: </span>
              <span className="text-red-600">{JSON.stringify(old[key])}</span>
            </div>
          ))}
        </div>
      );
    }
    return 'N/A';
  };

  const renderSubjectLink = (activity: Activity) => {
    const model = activity.subject_type.split('\\').pop()?.toLowerCase();
    if (!model) return 'N/A';
    
    let path = `${model}s`;
    if (model === 'user') {
        path = 'users';
    }

    if (['user', 'car', 'auction', 'bid'].includes(model)) {
      return (
        <a href={`/admin/${path}/${activity.subject_id}`} className="text-blue-500 hover:underline">
          {model} #{activity.subject_id}
        </a>
      );
    }
    return `${model} #${activity.subject_id}`;
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Fragment key={activity.id}>
                  <div 
                    className="bg-card p-4 rounded-lg shadow-sm border border-border cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleRowToggle(activity.id)}
                  >
                    <div className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-2">
                        <Badge>{activity.log_name}</Badge>
                      </div>
                      <div className="col-span-4 text-sm text-foreground">{activity.description}</div>
                      <div className="col-span-2 text-sm">{renderSubjectLink(activity)}</div>
                      <div className="col-span-2 text-sm text-foreground">
                        {activity.causer ? `${activity.causer.first_name} ${activity.causer.last_name}` : 'System'}
                      </div>
                      <div className="col-span-2 text-sm text-foreground/70">{format(new Date(activity.created_at), 'yyyy-MM-dd HH:mm:ss')}</div>
                      <div className="col-span-12 flex justify-end">
                        {expandedRow === activity.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>
                  {expandedRow === activity.id && (
                    <div className="p-4 bg-background rounded-b-lg border border-t-0 border-border">
                      {renderChanges(activity)}
                    </div>
                  )}
                </Fragment>
              ))}
              <div className="mt-4">
                <Pagination
                  totalPages={pagination.last_page}
                  page={pagination.current_page}
                  onPageChange={(_, page) => fetchActivities(page)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogsPage;
