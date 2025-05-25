/**
 * API utilities for the student application
 */

/**
 * Updates an assignment's column
 * 
 * @param assignmentId - The ID of the assignment to update
 * @param columnId - The ID of the target column
 * @param position - The position in the new column (optional)
 * @returns The updated assignment data
 */
export const updateAssignmentColumn = async (assignmentId: string, columnId: string, position?: number) => {
  try {
    console.log(`Calling API to update assignment ${assignmentId} to column ${columnId}${position !== undefined ? ` at position ${position}` : ''}`);
    
    const requestBody: { columnId: string; position?: number } = { columnId };
    if (position !== undefined) {
      requestBody.position = position;
    }
    
    const response = await fetch(`/api/assignments/${assignmentId}/column`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response from API:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      throw new Error(
        errorData.message || 
        errorData.error || 
        `Failed to update assignment column: ${response.status} ${response.statusText}`
      );
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating assignment column:', error);
    throw error;
  }
};

/**
 * Updates an assignment's notes
 * 
 * @param assignmentId - The ID of the assignment to update
 * @param notes - The updated notes content
 * @returns The updated assignment data
 */
export const updateAssignmentNotes = async (assignmentId: string, notes: string) => {
  try {
    const response = await fetch(`/api/assignments/${assignmentId}/notes`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to update assignment notes');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating assignment notes:', error);
    throw error;
  }
};

/**
 * Marks feedback on an assignment as read
 * 
 * @param assignmentId - The ID of the assignment
 * @returns The updated assignment data
 */
export const markFeedbackAsRead = async (assignmentId: string) => {
  try {
    const response = await fetch(`/api/assignments/${assignmentId}/feedback/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to mark feedback as read');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error marking feedback as read:', error);
    throw error;
  }
};

/**
 * Fetches a board by ID
 * 
 * @param boardId - The ID of the board to fetch
 * @returns The board data
 */
export const fetchBoard = async (boardId: string) => {
  const response = await fetch(`/api/boards/${boardId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to fetch board details');
  }

  return await response.json();
};

/**
 * Fetches assignments for a board
 * 
 * @param boardId - The ID of the board to fetch assignments for
 * @returns The assignments data
 */
export const fetchBoardAssignments = async (boardId: string) => {
  const response = await fetch(`/api/assignments/board/${boardId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to fetch board assignments');
  }

  return await response.json();
}; 