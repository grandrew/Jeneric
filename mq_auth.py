"""
A configuration module must contain a definition of a Parm class.

The function checker_config takes no args, and returns a dictionary
with the information needed to assign a credentials checker.

The 'sec_type' member defines the type of security checker to use

The function group_config takes no args, and returns a function
that takes one arg (the username) and returns the list of groups
to which the user belongs.

This sample file uses ID, password and group information from a text
file.

The function get_group_access_rights takes no args, and returns a
function that takes two args (group name, queue name).

This second function returns the access levels that the group has
to that queue ('r', 'w', 'c')
r - read
w - write
c - create
"""
class Parms(object):
    def checker_config(self):
        return {
            'sec_type':'file',
            'filename':'userIdFile.txt',
            'cache':True
            }
    
    def read_id_file(self, name):
        userFile = open('userIdFile.txt','r')
        # A user is always a member of a group matching their name
        group = ['user']
        for line in userFile:
            fields = line.split(":")
            if (name == fields[0]):
                group.append(fields[2])
        userFile.close()
        return group
        
    def group_config(self):
        return  self.read_id_file

    def group_rights(self, groups, queue):
        if 'admin' in groups: return set(('c', 'r', 'w'))
        if queue == "/hub" or queue == "/announce":
                return set(('c', 'w'))
        return set(('c', 'r'))

    def get_group_access_rights(self):
        return self.group_rights
