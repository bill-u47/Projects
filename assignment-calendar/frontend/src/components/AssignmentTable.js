import React from 'react';

function AssignmentTable({ assignments }) {
  return (
    <div>
      <h2>Review & Edit Assignments</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black' }}>Name</th>
            <th style={{ border: '1px solid black' }}>Date</th>
            <th style={{ border: '1px solid black' }}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid black' }}>{a.assignments}</td>
              <td style={{ border: '1px solid black' }}>{a.date}</td>
              <td style={{ border: '1px solid black' }}>{a.notes || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AssignmentTable;