
"use client";

import { useState, useCallback, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import { UserProfile } from '@/hooks/use-user-profile';
import { Input } from '../ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

interface UserMultiSelectProps {
  allUsers: UserProfile[];
  selectedUsers: UserProfile[];
  onChange: (users: UserProfile[]) => void;
  placeholder?: string;
  maxSelection?: number;
}

const getInitials = (name: string = '') => {
  const parts = name.split(' ');
  if (parts.length > 1) {
    return `${parts[0]?.charAt(0) ?? ''}${parts[parts.length - 1]?.charAt(0) ?? ''}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

export function UserMultiSelect({ 
    allUsers, 
    selectedUsers = [], 
    onChange, 
    placeholder = "חפש לפי שם...",
    maxSelection 
}: UserMultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedUserIds = useMemo(() => selectedUsers.map(u => u.id), [selectedUsers]);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    return allUsers.filter(user => {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = `${firstName} ${lastName}`;
      
      return !selectedUserIds.includes(user.id) &&
        (fullName.toLowerCase().includes(lowerCaseSearchTerm) ||
         firstName.toLowerCase().includes(lowerCaseSearchTerm) ||
         lastName.toLowerCase().includes(lowerCaseSearchTerm));
    }).slice(0, 5);
  }, [searchTerm, allUsers, selectedUserIds]);
  

  const addUser = useCallback((user: UserProfile) => {
    if (maxSelection === 1) {
        onChange([user]);
    } else if (!selectedUserIds.includes(user.id)) {
        if (!maxSelection || selectedUsers.length < maxSelection) {
            onChange([...selectedUsers, user]);
        }
    }
    setSearchTerm("");
    inputRef.current?.focus();
  }, [selectedUsers, onChange, maxSelection, selectedUserIds]);

  const removeUser = useCallback((userId: string) => {
    onChange(selectedUsers.filter(u => u.id !== userId));
  }, [selectedUsers, onChange]);
  
  const isInputDisabled = !!maxSelection && selectedUsers.length >= maxSelection;

  return (
    <div className="flex flex-col gap-2">
      <div 
        className="flex flex-wrap items-center gap-2 p-2 border rounded-md min-h-[48px] cursor-text bg-background"
        onClick={() => inputRef.current?.focus()}
      >
        {selectedUsers.map(user => (
          <div key={user.id} className="flex items-center gap-2 bg-muted p-1 ps-3 rounded-full text-sm font-medium">
            <Avatar className="w-6 h-6">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback>{getInitials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
            </Avatar>
            <span>{`${user.firstName} ${user.lastName}`}</span>
            <button type="button" onClick={() => removeUser(user.id)} className="rounded-full hover:bg-destructive/20 p-1">
              <X className="w-4 h-4"/>
            </button>
          </div>
        ))}
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            placeholder={isInputDisabled ? "" : placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-none focus-visible:ring-0 shadow-none p-0 h-auto min-w-[120px]"
            autoComplete="off"
            disabled={isInputDisabled}
          />
        </div>
      </div>
      {searchTerm && !isInputDisabled && (
        <div className="relative">
          <div className="absolute top-0 right-0 mt-1 w-full bg-background border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map(result => (
                <div 
                  key={result.id}
                  onClick={() => addUser(result)}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={result.photoURL || undefined} />
                    <AvatarFallback>{getInitials(`${result.firstName} ${result.lastName}`)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{`${result.firstName} ${result.lastName}`}</p>
                    <p className="text-xs text-muted-foreground">{result.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-sm text-muted-foreground">לא נמצאו משתמשים.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
