import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Award, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { createHackathon, getHackathons } from '../../firebaseConfig';

export default function HackathonManagement() {
  const [hackathons, setHackathons] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    maxParticipants: 100,
    skillLevel: 'intermediate',
    technologies: ''
  });
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    loadHackathons();
  }, []);

  const loadHackathons = async () => {
    try {
      const hackathonData = await getHackathons();
      setHackathons(hackathonData);
    } catch (error) {
      console.error('Error loading hackathons:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      maxParticipants: 100,
      skillLevel: 'intermediate',
      technologies: ''
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert technologies string to array
      const techArray = formData.technologies.split(',').map(tech => tech.trim()).filter(tech => tech !== '');
      
      const newHackathon = {
        ...formData,
        technologies: techArray,
        status: new Date(formData.startDate) > new Date() ? 'upcoming' : 
                (new Date(formData.endDate) < new Date() ? 'completed' : 'active'),
        participants: [],
        submissions: [],
        createdAt: new Date().toISOString()
      };
      
      await createHackathon(newHackathon);
      await loadHackathons();
      setIsCreating(false);
      resetForm();
    } catch (error) {
      console.error('Error creating hackathon:', error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // In a real app, this would update the hackathon in Firestore
      // For demo, we'll update the local state
      const techArray = formData.technologies.split(',').map(tech => tech.trim()).filter(tech => tech !== '');
      
      const updatedHackathons = hackathons.map(hackathon => {
        if (hackathon.id === editingId) {
          return {
            ...hackathon,
            ...formData,
            technologies: techArray,
            status: new Date(formData.startDate) > new Date() ? 'upcoming' : 
                    (new Date(formData.endDate) < new Date() ? 'completed' : 'active'),
          };
        }
        return hackathon;
      });
      
      setHackathons(updatedHackathons);
      localStorage.setItem('hackathons', JSON.stringify(updatedHackathons));
      setIsEditing(false);
      setEditingId(null);
      resetForm();
    } catch (error) {
      console.error('Error updating hackathon:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this hackathon?')) {
      try {
        // In a real app, this would delete from Firestore
        // For demo, we'll update the local state
        const updatedHackathons = hackathons.filter(hackathon => hackathon.id !== id);
        setHackathons(updatedHackathons);
        localStorage.setItem('hackathons', JSON.stringify(updatedHackathons));
      } catch (error) {
        console.error('Error deleting hackathon:', error);
      }
    }
  };

  const handleEdit = (hackathon) => {
    setIsEditing(true);
    setEditingId(hackathon.id);
    setFormData({
      title: hackathon.title,
      description: hackathon.description,
      startDate: hackathon.startDate,
      endDate: hackathon.endDate,
      maxParticipants: hackathon.maxParticipants || 100,
      skillLevel: hackathon.skillLevel || 'intermediate',
      technologies: Array.isArray(hackathon.technologies) ? hackathon.technologies.join(', ') : ''
    });
  };

  const filteredHackathons = hackathons.filter(hackathon => {
    if (activeTab === 'all') return true;
    return hackathon.status === activeTab;
  });

  return (
    <div className="hackathon-management">
      <div className="card-header flex justify-between items-center">
        <div>
          <h2 className="card-title">Hackathon Management</h2>
          <p className="card-subtitle">Create and manage coding competitions</p>
        </div>
        <button 
          onClick={() => {
            setIsCreating(true);
            setIsEditing(false);
            resetForm();
          }}
          className="btn btn-primary"
        >
          <Plus size={16} className="mr-1" /> New Hackathon
        </button>
      </div>

      {(isCreating || isEditing) ? (
        <div className="p-6 border rounded-lg bg-gray-50 my-4">
          <h3 className="text-lg font-semibold mb-4">
            {isCreating ? 'Create New Hackathon' : 'Edit Hackathon'}
          </h3>
          <form onSubmit={isCreating ? handleCreateSubmit : handleEditSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Skill Level</label>
                <select
                  name="skillLevel"
                  value={formData.skillLevel}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Max Participants</label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  className="form-input"
                  min="1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Technologies (comma separated)</label>
                <input
                  type="text"
                  name="technologies"
                  value={formData.technologies}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="React, Node.js, MongoDB"
                />
              </div>
            </div>
            
            <div className="form-group mb-4">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea"
                rows="4"
                required
              ></textarea>
            </div>
            
            <div className="flex space-x-2">
              <button type="submit" className="btn btn-primary">
                {isCreating ? 'Create Hackathon' : 'Update Hackathon'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  resetForm();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="flex border-b mb-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 font-medium ${activeTab === 'active' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 font-medium ${activeTab === 'upcoming' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 font-medium ${activeTab === 'completed' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Completed
            </button>
          </div>

          {filteredHackathons.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hackathons found in this category.</p>
              <button 
                onClick={() => setIsCreating(true)}
                className="btn btn-primary mt-4"
              >
                Create Your First Hackathon
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHackathons.map((hackathon) => (
                <div key={hackathon.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{hackathon.title}</h3>
                      <p className="text-gray-600 mt-1">{hackathon.description}</p>
                    </div>
                    <div>
                      <span className={`badge ${hackathon.status === 'active' ? 'badge-success' : hackathon.status === 'upcoming' ? 'badge-info' : 'badge-secondary'}`}>
                        {hackathon.status.charAt(0).toUpperCase() + hackathon.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-500 mr-2" />
                      <span className="text-sm">
                        {hackathon.startDate} to {hackathon.endDate}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users size={16} className="text-gray-500 mr-2" />
                      <span className="text-sm">
                        {hackathon.participants?.length || 0} / {hackathon.maxParticipants || 'Unlimited'} Participants
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Award size={16} className="text-gray-500 mr-2" />
                      <span className="text-sm capitalize">
                        {hackathon.skillLevel || 'All'} Level
                      </span>
                    </div>
                  </div>
                  
                  {hackathon.technologies && hackathon.technologies.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(hackathon.technologies) ? (
                          hackathon.technologies.map((tech, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                              {tech}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                            {hackathon.technologies}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end space-x-2">
                    <button 
                      onClick={() => handleEdit(hackathon)}
                      className="btn btn-sm btn-secondary"
                    >
                      <Edit size={14} className="mr-1" /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(hackathon.id)}
                      className="btn btn-sm btn-danger"
                    >
                      <Trash2 size={14} className="mr-1" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}