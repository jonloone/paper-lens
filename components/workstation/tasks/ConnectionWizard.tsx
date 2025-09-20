'use client';

import React, { useState } from 'react';
import type { UserRole } from '@/app/workstation/page';

interface ConnectionWizardProps {
  role: UserRole;
}

export function ConnectionWizard({ role }: ConnectionWizardProps) {
  const [step, setStep] = useState(1);
  const [connectionType, setConnectionType] = useState('');
  const [connectionConfig, setConnectionConfig] = useState({
    name: '',
    host: '',
    port: '',
    database: '',
    username: '',
    password: ''
  });

  const connectionTypes = [
    { id: 'postgres', name: 'PostgreSQL', icon: 'fas fa-database' },
    { id: 'mysql', name: 'MySQL', icon: 'fas fa-database' },
    { id: 'snowflake', name: 'Snowflake', icon: 'fas fa-snowflake' },
    { id: 's3', name: 'Amazon S3', icon: 'fas fa-box' },
    { id: 'salesforce', name: 'Salesforce', icon: 'fas fa-cloud' },
    { id: 'kafka', name: 'Apache Kafka', icon: 'fas fa-stream' }
  ];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-serif-display text-white mb-2">
              Connection Wizard
            </h1>
            <p className="text-gray-400 font-sans-ui">
              Add a new data source connection to your workspace
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-sans-ui font-medium ${
                  step >= stepNum ? 'bg-accent-blue-50 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-0.5 ${
                    step > stepNum ? 'bg-accent-blue-50' : 'bg-gray-700'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          <div className="glass-panel p-8 rounded-xl">
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-serif-display text-white mb-6">
                  Choose Connection Type
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connectionTypes.map(type => (
                    <div
                      key={type.id}
                      onClick={() => setConnectionType(type.id)}
                      className={`p-6 border rounded-lg cursor-pointer transition-all text-center ${
                        connectionType === type.id 
                          ? 'border-accent-blue-50 bg-accent-blue-50/10' 
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <i className={`${type.icon} text-3xl mb-4 ${
                        connectionType === type.id ? 'text-accent-blue-50' : 'text-gray-400'
                      }`} />
                      <h3 className="font-sans-ui font-medium text-white">
                        {type.name}
                      </h3>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-serif-display text-white mb-6">
                  Connection Details
                </h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-sans-ui text-gray-300 mb-2">
                      Connection Name
                    </label>
                    <input
                      type="text"
                      value={connectionConfig.name}
                      onChange={(e) => setConnectionConfig({...connectionConfig, name: e.target.value})}
                      className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-accent-blue-50 focus:outline-none"
                      placeholder="My Database Connection"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-sans-ui text-gray-300 mb-2">
                      Host
                    </label>
                    <input
                      type="text"
                      value={connectionConfig.host}
                      onChange={(e) => setConnectionConfig({...connectionConfig, host: e.target.value})}
                      className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-accent-blue-50 focus:outline-none"
                      placeholder="localhost"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-sans-ui text-gray-300 mb-2">
                        Port
                      </label>
                      <input
                        type="text"
                        value={connectionConfig.port}
                        onChange={(e) => setConnectionConfig({...connectionConfig, port: e.target.value})}
                        className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-accent-blue-50 focus:outline-none"
                        placeholder="5432"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-sans-ui text-gray-300 mb-2">
                        Database
                      </label>
                      <input
                        type="text"
                        value={connectionConfig.database}
                        onChange={(e) => setConnectionConfig({...connectionConfig, database: e.target.value})}
                        className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-accent-blue-50 focus:outline-none"
                        placeholder="mydb"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-sans-ui text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={connectionConfig.username}
                      onChange={(e) => setConnectionConfig({...connectionConfig, username: e.target.value})}
                      className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-accent-blue-50 focus:outline-none"
                      placeholder="admin"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-serif-display text-white mb-6">
                  Test & Save Connection
                </h2>
                <div className="space-y-6">
                  <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <i className="fas fa-check-circle text-green-400" />
                      <span className="font-sans-ui text-green-300">Connection test successful!</span>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-700 rounded-lg">
                    <h3 className="font-sans-ui font-medium text-white mb-2">Connection Summary</h3>
                    <div className="space-y-1 text-sm text-gray-300">
                      <div>Type: {connectionType}</div>
                      <div>Name: {connectionConfig.name || 'Unnamed'}</div>
                      <div>Host: {connectionConfig.host || 'Not specified'}</div>
                      <div>Database: {connectionConfig.database || 'Not specified'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={step === 1}
              className="px-6 py-3 border border-gray-700 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-sans-ui font-medium transition-colors"
            >
              Previous
            </button>
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={step === 1 && !connectionType}
                className="px-6 py-3 bg-accent-blue-50 hover:bg-accent-blue-60 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-sans-ui font-medium transition-colors"
              >
                Next
              </button>
            ) : (
              <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-sans-ui font-medium transition-colors">
                Save Connection
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}